const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    body: {
        type: String,
        required: true,
        maxlength: 1000,
        trim: true
    },
    flags: {
        advisory: {
            type: Boolean,
            default: false
        }
    },
    status: {
        type: String,
        enum: ['active', 'hidden', 'removed'],
        default: 'active'
    }
}, { timestamps: true });

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ status: 1 });

module.exports = mongoose.model('Comment', commentSchema);
