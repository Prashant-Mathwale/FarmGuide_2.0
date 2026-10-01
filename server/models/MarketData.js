const mongoose = require('mongoose');

const marketDataSchema = new mongoose.Schema({
    cropName: { type: String, required: true },
    marketName: { type: String, required: true },
    districtName: { type: String, required: true },
    stateName: { type: String, required: true },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    modalPrice: { type: Number },
    recordedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MarketData', marketDataSchema);
