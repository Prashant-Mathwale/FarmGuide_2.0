const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        enum: ['post', 'comment'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    note: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    }
}, { timestamps: true });

// Ensure a user can report each target at most once
reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);
