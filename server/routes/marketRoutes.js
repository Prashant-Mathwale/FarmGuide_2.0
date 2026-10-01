const express = require('express');
const router = express.Router();
const { getMarketPrices, getMarketTrend } = require('../controllers/marketController');
const { protect } = require('../middleware/auth');

router.get('/prices', protect, getMarketPrices);
router.get('/trend', protect, getMarketTrend);

module.exports = router;
