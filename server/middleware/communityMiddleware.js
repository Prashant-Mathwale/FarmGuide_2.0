const multer = require('multer');
const rateLimit = require('express-rate-limit');
const config = require('../config/community');

// Multer memory storage configuration
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (config.limits.allowedImageMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid image type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: config.limits.maxImageSizeBytes,
        files: config.limits.maxImagesPerPost
    },
    fileFilter
});

// Middleware for uploading up to 3 images named 'images'
const uploadCommunityImages = (req, res, next) => {
    const uploadMiddleware = upload.array('images', config.limits.maxImagesPerPost);
    uploadMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    success: false, 
                    message: `File size too large. Maximum allowed size is ${config.limits.maxImageSizeBytes / (1024 * 1024)}MB per image.` 
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Too many files. Maximum ${config.limits.maxImagesPerPost} images allowed.` 
                });
            }
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// Rate limiters per authenticated user (or fallback to IP)
const postRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: config.rateLimits.postsPerHour,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    validate: { keyGeneratorIpFallback: false },
    message: {
        success: false,
        message: `Hourly post limit reached (${config.rateLimits.postsPerHour} posts/hour). Please try again later.`
    },
    standardHeaders: true,
    legacyHeaders: false
});

const commentRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: config.rateLimits.commentsPerHour,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    validate: { keyGeneratorIpFallback: false },
    message: {
        success: false,
        message: `Hourly comment limit reached (${config.rateLimits.commentsPerHour} comments/hour). Please try again later.`
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    uploadCommunityImages,
    postRateLimiter,
    commentRateLimiter
};
