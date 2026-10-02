const User = require('../models/User');
const Crop = require('../models/Crop');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

// 10-digit Indian mobile regex starting with 6, 7, 8, or 9
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

const registerUser = async (req, res) => {
    try {
        const { fullName, phone, password, state, district, landSizeAcres, crops, language } = req.body;

        // Validation
        if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
            return res.status(400).json({ success: false, message: 'Full name is required' });
        }

        if (!phone || typeof phone !== 'string' || !INDIAN_PHONE_REGEX.test(phone.trim())) {
            return res.status(400).json({ 
                success: false, 
                message: 'A valid 10-digit Indian mobile number is required (starts with 6-9)' 
            });
        }

        if (!password || typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters long' 
            });
        }

        if (!state || typeof state !== 'string' || !state.trim()) {
            return res.status(400).json({ success: false, message: 'State is required' });
        }

        if (!district || typeof district !== 'string' || !district.trim()) {
            return res.status(400).json({ success: false, message: 'District is required' });
        }

        // Crops: multi-select, at least 1 required
        if (!crops || !Array.isArray(crops) || crops.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one crop must be selected' 
            });
        }

        // Validate selected crops exist in DB
        const existingCrops = await Crop.find({ _id: { $in: crops } });
        if (existingCrops.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Selected crop(s) not found in system' 
            });
        }
        const cropIds = existingCrops.map(c => c._id);

        const cleanPhone = phone.trim();
        const userExists = await User.findOne({ phone: cleanPhone });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Phone number already registered' });
        }

        const parsedLandSize = landSizeAcres !== undefined && landSizeAcres !== '' 
            ? Number(landSizeAcres) 
            : 1;

        if (isNaN(parsedLandSize) || parsedLandSize < 0) {
            return res.status(400).json({ success: false, message: 'Land size must be a positive number' });
        }

        const user = await User.create({
            fullName: fullName.trim(),
            phone: cleanPhone,
            passwordHash: password,
            state: state.trim(),
            district: district.trim(),
            landSizeAcres: parsedLandSize,
            crops: cropIds,
            language: (language && typeof language === 'string') ? language.trim() : 'en',
            role: 'farmer'
        });

        const createdUser = await User.findById(user._id)
            .select('-passwordHash')
            .populate('crops', '_id key name names active');

        const safeUser = createdUser.toObject();
        if (!safeUser.crops) safeUser.crops = [];
        if (!safeUser.language) safeUser.language = 'en';

        res.status(201).json({
            ...safeUser,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message || 'Registration failed' });
    }
};

const loginUser = async (req, res) => {
    const { phone, password } = req.body;
    try {
        if (!phone || !password) {
            return res.status(400).json({ success: false, message: 'Phone and password are required' });
        }

        const user = await User.findOne({ phone: phone.trim() })
            .populate('crops', '_id key name names active');

        if (user && (await user.matchPassword(password))) {
            const safeUser = user.toObject();
            delete safeUser.passwordHash;
            if (!safeUser.crops) safeUser.crops = [];
            if (!safeUser.language) safeUser.language = 'en';

            res.json({
                ...safeUser,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid phone or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const user = await User.findById(req.user._id)
            .select('-passwordHash')
            .populate('crops', '_id key name names active');

        if (user) {
            const safeUser = user.toObject();
            if (!safeUser.crops) safeUser.crops = [];
            if (!safeUser.language) safeUser.language = 'en';
            res.json(safeUser);
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { registerUser, loginUser, getUserProfile };
