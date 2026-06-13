const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/timeline-insights', authenticateToken, aiController.getTimelineInsights);

module.exports = router;
