const fs = require('fs');
const path = require('path');
const Crop = require('../models/Crop');

const getCrops = async (req, res) => {
    try {
        const crops = await Crop.find({ active: true }).sort({ name: 1 }).select('_id key name names active');
        res.json({ success: true, crops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLocations = async (req, res) => {
    try {
        const locationsPath = path.resolve(__dirname, '../data/locations.json');
        if (!fs.existsSync(locationsPath)) {
            return res.status(404).json({ success: false, message: 'Locations file not found' });
        }
        const data = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));
        res.json({ success: true, locations: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCrops,
    getLocations
};
