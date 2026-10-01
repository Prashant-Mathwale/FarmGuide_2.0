const express = require('express');
const router = express.Router();
const { getWeatherForecast } = require('../controllers/weatherController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWeatherForecast);

module.exports = router;
