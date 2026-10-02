/**
 * Community Configuration
 * All limits, thresholds, and patterns are managed here and via environment variables.
 */
module.exports = {
    // Text limits
    limits: {
        postTitleMax: parseInt(process.env.COMMUNITY_POST_TITLE_MAX, 10) || 120,
        postBodyMax: parseInt(process.env.COMMUNITY_POST_BODY_MAX, 10) || 2000,
        commentBodyMax: parseInt(process.env.COMMUNITY_COMMENT_BODY_MAX, 10) || 1000,
        maxImagesPerPost: parseInt(process.env.COMMUNITY_MAX_IMAGES, 10) || 3,
        maxImageSizeBytes: (parseInt(process.env.COMMUNITY_MAX_IMAGE_MB, 10) || 5) * 1024 * 1024, // 5MB default
        imageMaxWidthPx: 1280,
        imageQualityJpeg: 85,
        allowedImageMimes: ['image/jpeg', 'image/png', 'image/webp']
    },

    // Moderation
    moderation: {
        // Number of distinct reporters needed to automatically hide content
        reportThresholdToHide: parseInt(process.env.COMMUNITY_REPORT_HIDE_THRESHOLD, 10) || 3
    },

    // Rate limits (per user per hour)
    rateLimits: {
        postsPerHour: parseInt(process.env.COMMUNITY_POSTS_PER_HOUR, 10) || 20,
        commentsPerHour: parseInt(process.env.COMMUNITY_COMMENTS_PER_HOUR, 10) || 60
    },

    // Storage
    storage: {
        driver: process.env.STORAGE_DRIVER || 'local', // 'local' | 'cloudinary'
        localUploadDir: 'uploads/community',
        staticUrlPrefix: '/uploads/community'
    },

    // Patterns for chemical/dosage advice flagging
    // e.g. "2g per liter", "1.5 ml/L", "spray 500ml", "copper oxychloride", etc.
    dosagePatterns: [
        /\b\d+(\.\d+)?\s*(g|gm|gram|grams|ml|liter|litre|l|kg)\s*(per|\/)\s*(liter|litre|l|acre|hectare|pump|tank)\b/i,
        /\b(dose|dosage|spray|apply|mix)\s*:\s*\d+(\.\d+)?\s*(g|gm|ml|l|kg)\b/i,
        /\b\d+(\.\d+)?\s*(g|gm|ml)\s*in\s*\d+\s*(l|liters|litres)\b/i,
        /\b(spray|apply)\s+\d+(\.\d+)?\s*(ml|gm|g|kg)\b/i,
        /\b(mancozeb|chlorpyrifos|carbendazim|streptocycline|copper hydroxide|copper oxychloride|imidacloprid|glyphosate|monocrotophos)\b/i
    ]
};
