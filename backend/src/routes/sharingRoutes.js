const express = require('express');
const sharingController = require('../controllers/sharingController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply auth check
router.use(authenticateToken);

// Doctor access
router.get('/accesses', sharingController.getDoctorAccesses);
router.post('/grant', sharingController.grantDoctorAccess);
router.delete('/revoke/:id', sharingController.revokeDoctorAccess);

// Family management
router.get('/family', sharingController.getFamily);
router.post('/family/add', sharingController.addFamilyMember);
router.delete('/family/member/:id', sharingController.deleteFamilyMember);

module.exports = router;
