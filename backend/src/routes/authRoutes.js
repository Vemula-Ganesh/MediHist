const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middlewares/securityMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authLimiter to protect against password brute forcing and OTP spamming
router.post('/register', authLimiter, authController.register);
router.post('/verify-otp', authLimiter, authController.verifyRegisterOTP);
router.post('/login', authLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/reset-password-request', authLimiter, authController.requestPasswordReset);
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
