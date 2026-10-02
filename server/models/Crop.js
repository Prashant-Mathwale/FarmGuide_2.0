const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
    key: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        lowercase: true 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    names: {
        en: { type: String },
        hi: { type: String },
        mr: { type: String }
    },
    active: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);
