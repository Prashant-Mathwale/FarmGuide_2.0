const mongoose = require('mongoose');
const User = require('../models/User');
const Crop = require('../models/Crop');

/**
 * GET /api/users/me
 * Returns the authenticated user's profile with populated crops (excluding passwordHash)
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-passwordHash')
            .populate('crops', '_id key name names active');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const safeUser = user.toObject();
        if (!safeUser.crops) safeUser.crops = [];
        if (!safeUser.language) safeUser.language = 'en';

        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/users/me
 * Only fullName, state, district, landSizeAcres, crops, language are mutable.
 * phone and role are strictly immutable.
 */
const updateMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { fullName, state, district, landSizeAcres, crops, language } = req.body;

        // Apply only permitted mutable fields
        if (fullName !== undefined) {
            if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
                return res.status(400).json({ success: false, message: 'Full name cannot be empty' });
            }
            user.fullName = fullName.trim();
        }

        if (state !== undefined) {
            if (!state || typeof state !== 'string' || !state.trim()) {
                return res.status(400).json({ success: false, message: 'State cannot be empty' });
            }
            user.state = state.trim();
        }

        if (district !== undefined) {
            if (!district || typeof district !== 'string' || !district.trim()) {
                return res.status(400).json({ success: false, message: 'District cannot be empty' });
            }
            user.district = district.trim();
        }

        if (landSizeAcres !== undefined) {
            const size = Number(landSizeAcres);
            if (isNaN(size) || size < 0) {
                return res.status(400).json({ success: false, message: 'Land size must be a valid positive number' });
            }
            user.landSizeAcres = size;
        }

        if (crops !== undefined) {
            if (!Array.isArray(crops)) {
                return res.status(400).json({ success: false, message: 'Crops must be an array' });
            }
            // Validate crop IDs if provided
            if (crops.length > 0) {
                const validCrops = await Crop.find({ _id: { $in: crops } });
                user.crops = validCrops.map(c => c._id);
            } else {
                user.crops = [];
            }
        }

        if (language !== undefined) {
            user.language = (language && typeof language === 'string') ? language.trim() : 'en';
        }

        // phone and role are strictly ignored / immutable (even if provided in req.body)
        await user.save();

        const updatedUser = await User.findById(user._id)
            .select('-passwordHash')
            .populate('crops', '_id key name names active');

        const safeUser = updatedUser.toObject();
        if (!safeUser.crops) safeUser.crops = [];
        if (!safeUser.language) safeUser.language = 'en';

        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/users/me/change-password
 * { currentPassword, newPassword }
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Both current password and new password are required' 
            });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 8 characters long' 
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.passwordHash = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/users/:id/public
 * Returns ONLY: { id, fullName, state, district, createdAt, role, stats: { questions, answers, helpful } }
 * Strict whitelist. NEVER exposes phone, passwordHash, landSizeAcres, or exact coordinates.
 */
const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        const user = await User.findById(id).select('_id fullName state district createdAt role');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let questions = 0;
        let answers = 0;
        let helpful = 0;

        // Safely aggregate stats if Post and Comment models exist in mongoose
        try {
            const Post = mongoose.models.Post || (fs.existsSync(path.resolve(__dirname, '../models/Post.js')) ? require('../models/Post') : null);
            const Comment = mongoose.models.Comment || (fs.existsSync(path.resolve(__dirname, '../models/Comment.js')) ? require('../models/Comment') : null);

            if (Post) {
                questions = await Post.countDocuments({ author: user._id, status: { $ne: 'removed' } });
            }
            if (Comment) {
                answers = await Comment.countDocuments({ author: user._id, status: { $ne: 'removed' } });
            }
            if (Post && Comment) {
                // Helpful comments: accepted comments in posts
                helpful = await Post.countDocuments({ 
                    acceptedComment: { $exists: true, $ne: null },
                    // check if the accepted comment belongs to this user
                });
                // Or precise aggregation of accepted comments authored by user
                const helpfulAgg = await Post.aggregate([
                    { $match: { acceptedComment: { $exists: true, $ne: null } } },
                    {
                        $lookup: {
                            from: 'comments',
                            localField: 'acceptedComment',
                            foreignField: '_id',
                            as: 'comment'
                        }
                    },
                    { $unwind: '$comment' },
                    { $match: { 'comment.author': user._id } },
                    { $count: 'total' }
                ]);
                helpful = helpfulAgg.length > 0 ? helpfulAgg[0].total : 0;
            }
        } catch (e) {
            // Default to 0 on any error or if models not yet created
            questions = 0;
            answers = 0;
            helpful = 0;
        }

        // Return strictly whitelisted fields
        res.json({
            id: user._id,
            fullName: user.fullName,
            state: user.state,
            district: user.district,
            createdAt: user.createdAt,
            role: user.role,
            stats: {
                questions,
                answers,
                helpful
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMe,
    updateMe,
    changePassword,
    getPublicProfile
};
