const express = require('express');
const recordController = require('../controllers/recordController');
const upload = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply global auth check
router.use(authenticateToken);

// Categories
router.get('/categories', recordController.getCategories);

// Core CRUD
router.get('/', recordController.getRecords);
router.post('/upload', upload.single('file'), recordController.uploadRecord);
router.delete('/:id', recordController.deleteRecord);
router.get('/:id/download', recordController.downloadRecord);

// AI Smart Search
router.post('/smart-search', recordController.smartSearch);

module.exports = router;
