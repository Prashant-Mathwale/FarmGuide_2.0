const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./app');
const User = require('./models/User');
const Crop = require('./models/Crop');

let server;
let baseUrl;

async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }

    return { status: res.status, data };
}

async function runStage1Tests() {
    console.log('🧪 Starting STAGE 1 Test Suite...\n');
    let passed = 0;
    let failed = 0;

    const assert = (condition, name) => {
        if (condition) {
            console.log(`  ✅ ${name}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${name}`);
            failed++;
        }
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        server = app.listen(0);
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;

        // Ensure at least one crop exists
        let testCrop = await Crop.findOne({ active: true });
        if (!testCrop) {
            testCrop = await Crop.create({
                key: 'tomato-test',
                name: 'Tomato Test',
                active: true
            });
        }

        // Clean up any old test users
        const testPhone = '9876543299';
        await User.deleteMany({ phone: { $in: [testPhone, '9876543298', '9999999999'] } });

        // ── TEST 1: Registration Validation ──
        // 1a. Invalid phone
        const resInvalidPhone = await request('/api/auth/register', {
            method: 'POST',
            body: {
                fullName: 'Test User',
                phone: '12345',
                password: 'password123',
                state: 'Maharashtra',
                district: 'Pune',
                crops: [testCrop._id]
            }
        });
        assert(resInvalidPhone.status === 400, 'Registration rejects invalid phone number');

        // 1b. Short password (< 8 chars)
        const resShortPwd = await request('/api/auth/register', {
            method: 'POST',
            body: {
                fullName: 'Test User',
                phone: testPhone,
                password: 'short',
                state: 'Maharashtra',
                district: 'Pune',
                crops: [testCrop._id]
            }
        });
        assert(resShortPwd.status === 400, 'Registration rejects password with fewer than 8 characters');

        // 1c. Missing crops
        const resNoCrops = await request('/api/auth/register', {
            method: 'POST',
            body: {
                fullName: 'Test User',
                phone: testPhone,
                password: 'password123',
                state: 'Maharashtra',
                district: 'Pune',
                crops: []
            }
        });
        assert(resNoCrops.status === 400, 'Registration rejects empty crops selection');

        // ── TEST 2: Successful Registration & No passwordHash Leak ──
        const resRegister = await request('/api/auth/register', {
            method: 'POST',
            body: {
                fullName: 'Kisan Kumar',
                phone: testPhone,
                password: 'securepassword123',
                state: 'Maharashtra',
                district: 'Pune',
                landSizeAcres: 3.5,
                crops: [testCrop._id],
                language: 'hi'
            }
        });
        assert(resRegister.status === 201, 'Registration succeeds with valid inputs');
        assert(Boolean(resRegister.data?.token), 'Registration returns auth token');
        assert(resRegister.data?.passwordHash === undefined, 'Registration response NEVER contains passwordHash');
        assert(resRegister.data?.fullName === 'Kisan Kumar', 'Registration returns correct user name');

        const token = resRegister.data?.token;
        const userId = resRegister.data?._id;

        // ── TEST 3: Profile API (GET /api/users/me) ──
        const resMe = await request('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        assert(resMe.status === 200, 'GET /api/users/me returns authenticated user');
        assert(resMe.data?.user?.crops?.length > 0, 'User profile populates crops array');
        assert(resMe.data?.user?.passwordHash === undefined, 'Profile response does not leak passwordHash');

        // ── TEST 4: Phone & Role Immutability on PATCH /api/users/me ──
        const resPatch = await request('/api/users/me', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: {
                fullName: 'Kisan Kumar Updated',
                phone: '9999999999', // should be ignored
                role: 'admin',       // should be ignored
                landSizeAcres: 5.0
            }
        });
        assert(resPatch.status === 200, 'PATCH /api/users/me succeeds');
        assert(resPatch.data?.user?.fullName === 'Kisan Kumar Updated', 'Allowed field (fullName) updated');
        assert(resPatch.data?.user?.phone === testPhone, 'Phone is strictly IMMUTABLE (attempted modification ignored)');
        assert(resPatch.data?.user?.role === 'farmer', 'Role is strictly IMMUTABLE (attempted modification ignored)');

        // Verify in DB directly
        const dbUser = await User.findById(userId);
        assert(dbUser.phone === testPhone, 'DB confirms phone was not changed');
        assert(dbUser.role === 'farmer', 'DB confirms role was not changed');

        // ── TEST 5: Public Profile Whitelist (GET /api/users/:id/public) ──
        const resPublic = await request(`/api/users/${userId}/public`);
        assert(resPublic.status === 200, 'GET /api/users/:id/public succeeds');
        
        const publicKeys = Object.keys(resPublic.data || {});
        const allowedKeys = ['id', 'fullName', 'state', 'district', 'createdAt', 'role', 'stats'];
        const unexpectedKeys = publicKeys.filter(k => !allowedKeys.includes(k));

        assert(unexpectedKeys.length === 0, `Public profile contains ONLY whitelisted fields. Unexpected: ${unexpectedKeys.join(', ')}`);
        assert(resPublic.data?.phone === undefined, 'Public profile NEVER exposes phone number');
        assert(resPublic.data?.landSizeAcres === undefined, 'Public profile NEVER exposes land size');
        assert(resPublic.data?.passwordHash === undefined, 'Public profile NEVER exposes passwordHash');
        assert(typeof resPublic.data?.stats === 'object', 'Public profile includes stats object with zeros when empty');

        // ── TEST 6: Password Change API ──
        // 6a. Wrong current password fails
        const resWrongPwd = await request('/api/users/me/change-password', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: { currentPassword: 'wrongpassword', newPassword: 'newsecurepassword123' }
        });
        assert(resWrongPwd.status === 401, 'Password change fails with incorrect current password');

        // 6b. Correct current password succeeds
        const resChangePwd = await request('/api/users/me/change-password', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: { currentPassword: 'securepassword123', newPassword: 'newsecurepassword123' }
        });
        assert(resChangePwd.status === 200, 'Password change succeeds with correct current password');

        // 6c. Can login with new password
        const resNewLogin = await request('/api/auth/login', {
            method: 'POST',
            body: { phone: testPhone, password: 'newsecurepassword123' }
        });
        assert(resNewLogin.status === 200, 'User can successfully login with new password');

        // Clean up test user
        await User.findByIdAndDelete(userId);

    } catch (err) {
        console.error('Test execution error:', err);
        failed++;
    } finally {
        if (server) server.close();
        await mongoose.disconnect();
    }

    console.log(`\nStage 1 Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    runStage1Tests();
}

module.exports = { runStage1Tests };
