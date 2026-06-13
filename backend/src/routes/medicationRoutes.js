const express = require('express');
const medicationController = require('../controllers/medicationController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', medicationController.getMedications);
router.post('/', medicationController.addMedication);
router.put('/:id', medicationController.updateMedication);
router.delete('/:id', medicationController.deleteMedication);

module.exports = router;
