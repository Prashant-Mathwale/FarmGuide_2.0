const mongoose = require('mongoose');

const soilDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    N_level: { type: Number, required: true },
    P_level: { type: Number, required: true },
    K_level: { type: Number, required: true },
    pH_value: { type: Number, required: true },
    moisture: { type: Number },
    inputMethod: { type: String, default: 'Manual' }
}, { timestamps: true });

module.exports = mongoose.model('SoilData', soilDataSchema);
