const express = require('express');
const router = express.Router();
const { getCrops, getLocations } = require('../controllers/metaController');

router.get('/crops', getCrops);
router.get('/locations', getLocations);

module.exports = router;
