const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getCropRecommendation, detectDisease, predictPest, predictYield, searchSchemes, predictRisk } = require('../controllers/mlController');
const { protect } = require('../middleware/auth');

// Configure Multer for memory storage with a 5MB limit
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/crop-recommendation', protect, getCropRecommendation);
router.post('/disease-detect', protect, upload.single('image'), detectDisease);
router.post('/pest-predict', protect, predictPest);
router.post('/yield-predict', protect, predictYield);
router.post('/schemes-search', protect, searchSchemes);
router.post('/predict-risk', protect, predictRisk);

module.exports = router;
