const express = require('express');
const emergencyController = require('../controllers/emergencyController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public route - scanned by responders from emergency card QR code
// Does NOT require JWT authentication
router.get('/public/:slug', emergencyController.getPublicProfile);

// Authenticated private routes
router.get('/', authenticateToken, emergencyController.getEmergencyCard);
router.put('/toggle', authenticateToken, emergencyController.toggleEmergencyActive);

module.exports = router;
