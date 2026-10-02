const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    crop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
        required: false
    },
    cropName: {
        type: String,
        trim: true,
        default: ''
    },
    title: {
        type: String,
        required: true,
        maxlength: 120,
        trim: true
    },
    body: {
        type: String,
        required: true,
        maxlength: 2000,
        trim: true
    },
    images: [{
        url: { type: String, required: true },
        width: { type: Number },
        height: { type: Number }
    }],
    state: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'en'
    },
    scanSummary: {
        label: { type: String },
        confidence: { type: Number },
        status: { type: String },
        modelVersion: { type: String }
    },
    commentCount: {
        type: Number,
        default: 0
    },
    isSolved: {
        type: Boolean,
        default: false
    },
    acceptedComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'hidden', 'removed'],
        default: 'active'
    }
}, { timestamps: true });

// Required indexes
postSchema.index({ crop: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ status: 1 });
postSchema.index({ title: 'text', body: 'text' }, { default_language: 'none', language_override: 'none' });

module.exports = mongoose.model('Post', postSchema);
