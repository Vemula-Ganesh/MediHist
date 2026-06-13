const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/rbacMiddleware');

const router = express.Router();

// Enforce that only ADMIN accounts can access these routes
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/analytics', adminController.getPlatformAnalytics);
router.get('/audit-logs', adminController.getAuditLogsList);
router.get('/users', adminController.getUsersList);
router.put('/users/:id/status', adminController.toggleUserStatus);

module.exports = router;
