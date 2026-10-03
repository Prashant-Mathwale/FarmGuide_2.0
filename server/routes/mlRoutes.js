const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    getCropRecommendation, 
    detectDisease, 
    predictPest, 
    predictYield,
    getDiseaseAdvisorOptions,
    getDiseaseAdvisory
} = require('../controllers/mlController');
const { protect, optionalProtect } = require('../middleware/auth');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/crop-recommendation', protect, getCropRecommendation);
router.post('/disease-detect', protect, upload.single('image'), detectDisease);
router.post('/pest-predict', protect, predictPest);
router.post('/yield-predict', protect, predictYield);

// Disease Advisor (Maharashtra Curated Knowledge Base)
router.get('/disease-advisor/options', optionalProtect, getDiseaseAdvisorOptions);
router.post('/disease-advisor/advisory', optionalProtect, getDiseaseAdvisory);
router.get('/disease-advisor/advisory', optionalProtect, getDiseaseAdvisory);

module.exports = router;
