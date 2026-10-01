const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getCropRecommendation, detectDisease, predictPest, predictIrrigation, predictYield } = require('../controllers/mlController');
const { protect } = require('../middleware/auth');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/crop-recommendation', protect, getCropRecommendation);
router.post('/disease-detect', protect, upload.single('image'), detectDisease);
router.post('/pest-predict', protect, predictPest);
router.post('/irrigation-predict', protect, predictIrrigation);
router.post('/yield-predict', protect, predictYield);

module.exports = router;
