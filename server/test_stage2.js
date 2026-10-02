const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./app');
const User = require('./models/User');
const Crop = require('./models/Crop');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Report = require('./models/Report');
const jwt = require('jsonwebtoken');

let server;
let baseUrl;

function createToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
}

async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const headers = { ...(options.headers || {}) };

    if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body instanceof FormData 
            ? options.body 
            : (options.body ? JSON.stringify(options.body) : undefined)
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }

    return { status: res.status, data };
}

async function runStage2Tests() {
    console.log('🧪 Starting STAGE 2 Community Test Suite...\n');
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

        // Ensure active crop exists
        let testCrop = await Crop.findOne({ active: true });
        if (!testCrop) {
            testCrop = await Crop.create({ key: 'wheat-test', name: 'Wheat Test', active: true });
        }

        // Clean up test data
        await User.deleteMany({ phone: { $in: ['9100000001', '9100000002', '9100000003', '9100000004'] } });
        await Post.deleteMany({ title: /Stage2Test/ });
        await Comment.deleteMany({});
        await Report.deleteMany({});
        try { await Post.collection.dropIndexes(); } catch (e) {}
        await Post.syncIndexes();

        // Create test users
        const userA = await User.create({
            fullName: 'Farmer A',
            phone: '9100000001',
            passwordHash: 'dummyhash',
            state: 'Maharashtra',
            district: 'Nashik',
            crops: [testCrop._id],
            language: 'mr'
        });

        const userB = await User.create({
            fullName: 'Farmer B',
            phone: '9100000002',
            passwordHash: 'dummyhash',
            state: 'Punjab',
            district: 'Ludhiana',
            crops: [testCrop._id],
            language: 'en'
        });

        const userC = await User.create({
            fullName: 'Farmer C',
            phone: '9100000003',
            passwordHash: 'dummyhash',
            state: 'Karnataka',
            district: 'Mysuru',
            crops: [testCrop._id],
            language: 'en'
        });

        const tokenA = createToken(userA._id);
        const tokenB = createToken(userB._id);
        const tokenC = createToken(userC._id);

        // ── TEST 1: Unauthenticated Requests Rejected ──
        const resUnauth = await request('/api/community/posts');
        assert(resUnauth.status === 401, 'Unauthenticated request to GET /api/community/posts is rejected (401)');

        const resUnauthPost = await request('/api/community/posts', {
            method: 'POST',
            body: { title: 'Test', body: 'Test body', crop: testCrop._id }
        });
        assert(resUnauthPost.status === 401, 'Unauthenticated request to POST /api/community/posts is rejected (401)');

        // ── TEST 2: Crop Must Exist ──
        const fakeCropId = new mongoose.Types.ObjectId();
        const resInvalidCrop = await request('/api/community/posts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: {
                title: 'Stage2Test Invalid Crop',
                body: 'Checking invalid crop rejection',
                crop: fakeCropId
            }
        });
        assert(resInvalidCrop.status === 400, 'Post creation rejected if crop does not exist (400)');

        // ── TEST 3: Author, State, District in Body Are Ignored ──
        const resCreatePost = await request('/api/community/posts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: {
                title: 'Stage2Test Valid Post',
                body: 'My leaves have dark spots in rainy weather',
                crop: testCrop._id,
                // Spoofed fields that MUST be ignored
                author: userB._id,
                state: 'SpoofedState',
                district: 'SpoofedDistrict',
                language: 'fr'
            }
        });

        assert(resCreatePost.status === 201, 'Post created successfully (201)');
        const createdPost = resCreatePost.data?.post;
        assert(createdPost?.author?._id?.toString() === userA._id.toString(), 'Author in body is ignored; copied from authenticated user');
        assert(createdPost?.state === 'Maharashtra', 'State in body is ignored; copied from user profile (Maharashtra)');
        assert(createdPost?.district === 'Nashik', 'District in body is ignored; copied from user profile (Nashik)');
        assert(createdPost?.language === 'mr', 'Language in body is ignored; copied from user profile (mr)');

        const postId = createdPost._id;

        // ── TEST 4: Comments and Dosage Advice Advisory Flag ──
        // 4a. Regular comment
        const resNormalComment = await request(`/api/community/posts/${postId}/comments`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenB}` },
            body: { body: 'Ensure proper spacing between plants and avoid overhead watering.' }
        });
        assert(resNormalComment.status === 201, 'Comment added successfully');
        assert(resNormalComment.data?.comment?.flags?.advisory === false, 'Non-chemical comment does not flag advisory');
        const commentId1 = resNormalComment.data?.comment?._id;

        // 4b. Dosage advice comment
        const resDosageComment = await request(`/api/community/posts/${postId}/comments`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenB}` },
            body: { body: 'Spray 2g per liter copper hydroxide or streptocycline immediately.' }
        });
        assert(resDosageComment.status === 201, 'Dosage comment created');
        assert(resDosageComment.data?.comment?.flags?.advisory === true, 'Chemical dosage advice automatically detected with flags.advisory = true');
        const commentId2 = resDosageComment.data?.comment?._id;

        // ── TEST 5: Only Post Author Can Mark Helpful ──
        // 5a. Non-author (User B) attempts to mark helpful -> 403
        const resNonAuthorHelpful = await request(`/api/community/posts/${postId}/helpful/${commentId1}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        assert(resNonAuthorHelpful.status === 403, 'Non-author cannot mark comment as helpful (403)');

        // 5b. Author (User A) marks helpful -> 200, isSolved = true
        const resAuthorHelpful = await request(`/api/community/posts/${postId}/helpful/${commentId1}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        assert(resAuthorHelpful.status === 200, 'Post author can mark comment as helpful (200)');
        assert(resAuthorHelpful.data?.isSolved === true, 'Post marked as solved (isSolved = true)');
        assert(resAuthorHelpful.data?.acceptedComment?.toString() === commentId1.toString(), 'Accepted comment recorded');

        // 5c. Author toggles off -> isSolved = false
        const resToggleOff = await request(`/api/community/posts/${postId}/helpful/${commentId1}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        assert(resToggleOff.data?.isSolved === false, 'Helpful toggle unmarks solved status');

        // ── TEST 6: Reporting and Auto-Hiding ──
        // User A reports Post (wait, User B reports Post)
        const resRep1 = await request('/api/community/report', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenB}` },
            body: { targetType: 'post', targetId: postId, reason: 'Spam' }
        });
        assert(resRep1.status === 201, 'First user reports post');

        // Duplicate report from User B rejected
        const resRepDup = await request('/api/community/report', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenB}` },
            body: { targetType: 'post', targetId: postId, reason: 'Duplicate test' }
        });
        assert(resRepDup.status === 400, 'Duplicate report by same user rejected (400)');

        // User C reports Post
        await request('/api/community/report', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenC}` },
            body: { targetType: 'post', targetId: postId, reason: 'Inappropriate' }
        });

        // User 4 reports Post (reaches threshold of 3)
        const userD = await User.create({
            fullName: 'Farmer D',
            phone: '9100000004',
            passwordHash: 'dummyhash',
            state: 'Punjab',
            district: 'Patiala'
        });
        const tokenD = createToken(userD._id);

        const resRep3 = await request('/api/community/report', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenD}` },
            body: { targetType: 'post', targetId: postId, reason: 'Harmful' }
        });
        assert(resRep3.status === 201, 'Third distinct user reports post');

        // Verify post status is now "hidden"
        const postInDb = await Post.findById(postId);
        assert(postInDb.status === 'hidden', 'Post status automatically updated to "hidden" after reaching threshold');

        // ── TEST 7: Image Type / Sharp Processing Test ──
        // Test processing function with a valid tiny 1x1 image buffer
        const sharp = require('sharp');
        const tinyPng = await sharp({
            create: {
                width: 50,
                height: 50,
                channels: 3,
                background: { r: 120, g: 200, b: 80 }
            }
        }).png().toBuffer();

        const { processAndSaveImage } = require('./utils/imageProcessor');
        const processed = await processAndSaveImage(tinyPng);
        assert(typeof processed.url === 'string' && processed.url.endsWith('.jpg'), 'Image processed with sharp and saved as JPEG');
        assert(processed.width === 50 && processed.height === 50, 'Image dimensions recorded correctly');

        // Clean up
        await User.deleteMany({ phone: { $in: ['9100000001', '9100000002', '9100000003', '9100000004'] } });
        await Post.deleteMany({ _id: postId });
        await Comment.deleteMany({ post: postId });
        await Report.deleteMany({ targetId: postId });

    } catch (err) {
        console.error('Test execution error in Stage 2:', err);
        failed++;
    } finally {
        if (server) server.close();
        await mongoose.disconnect();
    }

    console.log(`\nStage 2 Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    runStage2Tests();
}

module.exports = { runStage2Tests };
