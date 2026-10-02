const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const Crop = require('../models/Crop');
const config = require('../config/community');
const { sanitizeText } = require('../utils/sanitize');
const { processAndSaveImage } = require('../utils/imageProcessor');

/**
 * GET /api/community/posts
 * Paginated query for community posts
 */
const getPosts = async (req, res) => {
    try {
        const { crop, q, filter = 'all', page = 1, limit = 10 } = req.query;

        const query = { status: 'active' };

        // Crop filter
        if (crop && mongoose.Types.ObjectId.isValid(crop)) {
            query.crop = crop;
        }

        // Sub-filters
        if (filter === 'unanswered') {
            query.commentCount = 0;
        } else if (filter === 'solved') {
            query.isSolved = true;
        } else if (filter === 'mine' && req.user) {
            query.author = req.user._id;
            delete query.status; // Author can see their active/hidden posts
            query.status = { $ne: 'removed' };
        }

        // Search query
        if (q && typeof q === 'string' && q.trim()) {
            const cleanQuery = q.trim();
            query.$or = [
                { title: { $regex: cleanQuery, $options: 'i' } },
                { body: { $regex: cleanQuery, $options: 'i' } }
            ];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const total = await Post.countDocuments(query);
        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('author', '_id fullName district state role')
            .populate('crop', '_id key name names');

        res.json({
            success: true,
            posts,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/community/posts
 * Creates a new community query post with optional up to 3 images
 * Reads author, state, district, language strictly from req.user
 */
const createPost = async (req, res) => {
    try {
        const { crop, title, body, scanSummary } = req.body;

        // Validation: Crop
        if (!crop || !mongoose.Types.ObjectId.isValid(crop)) {
            return res.status(400).json({ success: false, message: 'Valid crop ID is required' });
        }
        const existingCrop = await Crop.findById(crop);
        if (!existingCrop) {
            return res.status(400).json({ success: false, message: 'Crop not found in system' });
        }

        // Validation: Title
        const cleanTitle = sanitizeText(title);
        if (!cleanTitle) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }
        if (cleanTitle.length > config.limits.postTitleMax) {
            return res.status(400).json({ 
                success: false, 
                message: `Title cannot exceed ${config.limits.postTitleMax} characters` 
            });
        }

        // Validation: Body
        const cleanBody = sanitizeText(body);
        if (!cleanBody) {
            return res.status(400).json({ success: false, message: 'Description/body is required' });
        }
        if (cleanBody.length > config.limits.postBodyMax) {
            return res.status(400).json({ 
                success: false, 
                message: `Body cannot exceed ${config.limits.postBodyMax} characters` 
            });
        }

        // Image processing
        const processedImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            if (req.files.length > config.limits.maxImagesPerPost) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Maximum ${config.limits.maxImagesPerPost} images allowed` 
                });
            }

            for (const file of req.files) {
                const imgData = await processAndSaveImage(file.buffer);
                processedImages.push(imgData);
            }
        }

        // Parse optional scan summary
        let parsedScanSummary = undefined;
        if (scanSummary) {
            try {
                parsedScanSummary = typeof scanSummary === 'string' 
                    ? JSON.parse(scanSummary) 
                    : scanSummary;
            } catch (e) {
                // Ignore parse error or keep raw
            }
        }

        // User data read ONLY from req.user (author, state, district, language in body are ignored)
        const post = await Post.create({
            author: req.user._id,
            crop: existingCrop._id,
            title: cleanTitle,
            body: cleanBody,
            images: processedImages,
            state: req.user.state,
            district: req.user.district,
            language: req.user.language || 'en',
            scanSummary: parsedScanSummary,
            status: 'active'
        });

        const populatedPost = await Post.findById(post._id)
            .populate('author', '_id fullName district state role')
            .populate('crop', '_id key name names');

        res.status(201).json({ success: true, post: populatedPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/community/posts/:id
 * Retrieves post details and comments
 */
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await Post.findById(id)
            .populate('author', '_id fullName district state role')
            .populate('crop', '_id key name names')
            .populate('acceptedComment');

        if (!post || post.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Post not found or removed' });
        }

        // If post is hidden, only author or admin can view
        if (post.status === 'hidden') {
            const isAuthor = req.user && req.user._id.toString() === post.author._id.toString();
            const isAdmin = req.user && req.user.role === 'admin';
            if (!isAuthor && !isAdmin) {
                return res.status(403).json({ success: false, message: 'This post is under moderation review' });
            }
        }

        const comments = await Comment.find({ post: id, status: 'active' })
            .sort({ createdAt: 1 })
            .populate('author', '_id fullName district state role');

        res.json({
            success: true,
            post,
            comments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/community/posts/:id
 * Only post author can edit title or body
 */
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await Post.findById(id);
        if (!post || post.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
        }

        const { title, body } = req.body;
        if (title !== undefined) {
            const cleanTitle = sanitizeText(title);
            if (!cleanTitle || cleanTitle.length > config.limits.postTitleMax) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Title must be between 1 and ${config.limits.postTitleMax} characters` 
                });
            }
            post.title = cleanTitle;
        }

        if (body !== undefined) {
            const cleanBody = sanitizeText(body);
            if (!cleanBody || cleanBody.length > config.limits.postBodyMax) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Body must be between 1 and ${config.limits.postBodyMax} characters` 
                });
            }
            post.body = cleanBody;
        }

        await post.save();

        const updated = await Post.findById(post._id)
            .populate('author', '_id fullName district state role')
            .populate('crop', '_id key name names');

        res.json({ success: true, post: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/community/posts/:id
 * Soft delete (post author or admin)
 */
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await Post.findById(id);
        if (!post || post.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const isAuthor = post.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
        }

        post.status = 'removed';
        await post.save();

        res.json({ success: true, message: 'Post removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/community/posts/:id/comments
 * Adds a comment to a post
 */
const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await Post.findById(id);
        if (!post || post.status !== 'active') {
            return res.status(404).json({ success: false, message: 'Post not available for commenting' });
        }

        const { body } = req.body;
        const cleanBody = sanitizeText(body);

        if (!cleanBody) {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }

        if (cleanBody.length > config.limits.commentBodyMax) {
            return res.status(400).json({ 
                success: false, 
                message: `Comment cannot exceed ${config.limits.commentBodyMax} characters` 
            });
        }

        // Check dosage advice pattern
        const isAdvisory = config.dosagePatterns.some(pattern => pattern.test(cleanBody));

        const comment = await Comment.create({
            post: post._id,
            author: req.user._id,
            body: cleanBody,
            flags: { advisory: isAdvisory },
            status: 'active'
        });

        // Increment post comment count
        post.commentCount = (post.commentCount || 0) + 1;
        await post.save();

        const populatedComment = await Comment.findById(comment._id)
            .populate('author', '_id fullName district state role');

        res.status(201).json({ success: true, comment: populatedComment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/community/comments/:id
 * Soft delete (comment author or admin)
 */
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(id);
        if (!comment || comment.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const isAuthor = comment.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
        }

        comment.status = 'removed';
        await comment.save();

        // Decrement post comment count
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

        res.json({ success: true, message: 'Comment removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/community/posts/:id/helpful/:commentId
 * Toggle mark comment as helpful (ONLY post author can do this)
 */
const toggleHelpful = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }

        const post = await Post.findById(id);
        if (!post || post.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // ONLY post author can mark helpful!
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only the author of the post can mark an answer as helpful' 
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment || comment.post.toString() !== post._id.toString() || comment.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Comment not found for this post' });
        }

        // Toggle logic
        if (post.acceptedComment && post.acceptedComment.toString() === commentId) {
            post.acceptedComment = null;
            post.isSolved = false;
        } else {
            post.acceptedComment = comment._id;
            post.isSolved = true;
        }

        await post.save();

        res.json({
            success: true,
            isSolved: post.isSolved,
            acceptedComment: post.acceptedComment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/community/report
 * Content is hidden after N distinct reporters
 */
const reportContent = async (req, res) => {
    try {
        const { targetType, targetId, reason, note } = req.body;

        if (!['post', 'comment'].includes(targetType)) {
            return res.status(400).json({ success: false, message: 'Invalid target type' });
        }

        if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ success: false, message: 'Valid target ID is required' });
        }

        if (!reason || typeof reason !== 'string' || !reason.trim()) {
            return res.status(400).json({ success: false, message: 'Reason is required' });
        }

        // Check if user already reported this target
        const existing = await Report.findOne({
            reporter: req.user._id,
            targetType,
            targetId
        });

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already reported this item' 
            });
        }

        await Report.create({
            reporter: req.user._id,
            targetType,
            targetId,
            reason: sanitizeText(reason),
            note: sanitizeText(note || ''),
            status: 'pending'
        });

        // Count distinct reports
        const count = await Report.countDocuments({ targetType, targetId });

        // Hide content if threshold is reached
        if (count >= config.moderation.reportThresholdToHide) {
            if (targetType === 'post') {
                await Post.findByIdAndUpdate(targetId, { status: 'hidden' });
            } else if (targetType === 'comment') {
                await Comment.findByIdAndUpdate(targetId, { status: 'hidden' });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully. Thank you for keeping the community safe.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: GET /api/community/admin/reports
 */
const getAdminReports = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const reports = await Report.find()
            .sort({ createdAt: -1 })
            .populate('reporter', '_id fullName phone role');

        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: POST /api/community/admin/moderate
 */
const moderateContent = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const { targetType, targetId, action } = req.body;
        const newStatus = action === 'restore' ? 'active' : 'removed';

        if (targetType === 'post') {
            await Post.findByIdAndUpdate(targetId, { status: newStatus });
        } else if (targetType === 'comment') {
            await Comment.findByIdAndUpdate(targetId, { status: newStatus });
        }

        await Report.updateMany({ targetType, targetId }, { status: 'resolved' });

        res.json({ success: true, message: `Content ${action}d successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPosts,
    createPost,
    getPostById,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    toggleHelpful,
    reportContent,
    getAdminReports,
    moderateContent
};
