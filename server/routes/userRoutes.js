const express = require('express');
const router = express.Router();
const { getMe, updateMe, changePassword, getPublicProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.post('/me/change-password', protect, changePassword);
router.get('/:id/public', getPublicProfile);

module.exports = router;
