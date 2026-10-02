const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    uploadCommunityImages,
    postRateLimiter,
    commentRateLimiter
} = require('../middleware/communityMiddleware');

const {
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
} = require('../controllers/communityController');

// All community endpoints require authentication
router.use(protect);

// Posts
router.get('/posts', getPosts);
router.post('/posts', postRateLimiter, uploadCommunityImages, createPost);
router.get('/posts/:id', getPostById);
router.patch('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

// Comments
router.post('/posts/:id/comments', commentRateLimiter, addComment);
router.delete('/comments/:id', deleteComment);

// Helpful comment toggle (only post author)
router.post('/posts/:id/helpful/:commentId', toggleHelpful);

// Moderation & Reporting
router.post('/report', reportContent);
router.get('/admin/reports', getAdminReports);
router.post('/admin/moderate', moderateContent);

module.exports = router;
