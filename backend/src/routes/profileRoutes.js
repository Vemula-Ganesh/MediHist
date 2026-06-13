const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply global auth check
router.use(authenticateToken);

// Profile
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

// Allergies
router.get('/allergies', profileController.getAllergies);
router.post('/allergies', profileController.addAllergy);
router.delete('/allergies/:id', profileController.deleteAllergy);

// Vaccinations
router.get('/vaccinations', profileController.getVaccinations);
router.post('/vaccinations', profileController.addVaccination);
router.delete('/vaccinations/:id', profileController.deleteVaccination);

// Diagnoses
router.get('/diagnoses', profileController.getDiagnoses);
router.post('/diagnoses', profileController.addDiagnosis);
router.delete('/diagnoses/:id', profileController.deleteDiagnosis);

// Appointments
router.get('/appointments', profileController.getAppointments);
router.post('/appointments', profileController.createAppointment);
router.put('/appointments/:id/cancel', profileController.cancelAppointment);

module.exports = router;
