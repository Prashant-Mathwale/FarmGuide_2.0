const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    landSizeAcres: { type: Number, default: 1 },
    role: { type: String, default: 'farmer', trim: true },
    crops: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Crop' 
    }],
    language: { 
        type: String, 
        default: 'en',
        trim: true 
    }
}, { timestamps: true });

userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.passwordHash;
        if (!ret.crops) ret.crops = [];
        if (!ret.language) ret.language = 'en';
        return ret;
    }
});

userSchema.set('toObject', {
    transform: function (doc, ret) {
        delete ret.passwordHash;
        if (!ret.crops) ret.crops = [];
        if (!ret.language) ret.language = 'en';
        return ret;
    }
});

userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
