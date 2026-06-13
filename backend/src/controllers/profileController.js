const prisma = require('../config/db');
const { encrypt, decrypt } = require('../services/cryptoService');
const auditService = require('../services/auditService');

// Helper to generate a unique Patient Health ID (e.g. MH-1234-5678)
const generateHealthId = () => {
  const segment1 = Math.floor(1000 + Math.random() * 9000);
  const segment2 = Math.floor(1000 + Math.random() * 9000);
  return `MH-${segment1}-${segment2}`;
};

/**
 * Fetches and decrypts the user's patient profile.
 */
const getProfile = async (req, res) => {
  // Allow accessing another user's profile if active family/consent delegation exists
  const targetUserId = req.query.userId || req.user.id;

  try {
    // Audit check: If doctor or caregiver is accessing, verify consent/access
    if (targetUserId !== req.user.id) {
      const hasAccess = await checkDelegatedAccess(req.user.id, targetUserId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Unauthorized profile access' });
      }
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: targetUserId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found. Please complete setup.' });
    }

    // Decrypt fields
    const decryptedProfile = {
      id: profile.id,
      userId: profile.userId,
      healthId: profile.healthId,
      fullName: profile.fullName, // Keep plain or decrypt depending on schema definition
      dob: decrypt(profile.dob),
      gender: decrypt(profile.gender),
      bloodGroup: decrypt(profile.bloodGroup),
      height: decrypt(profile.height),
      weight: decrypt(profile.weight),
      emergencyContact: decrypt(profile.emergencyContact),
      address: decrypt(profile.address),
      insuranceInfo: decrypt(profile.insuranceInfo),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };

    if (targetUserId !== req.user.id) {
      await auditService.logEvent(req.user.id, 'RECORD_ACCESS', `Delegated access to profile of user ID ${targetUserId}`, req.ip);
    }

    res.status(200).json(decryptedProfile);
  } catch (error) {
    console.error('❌ Get profile error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve profile data' });
  }
};

/**
 * Creates or updates patient profile details with field encryption.
 */
const updateProfile = async (req, res) => {
  const targetUserId = req.body.userId || req.user.id;

  // Restrict editing other profiles unless authorized (e.g. parent/caregiver with full access)
  if (targetUserId !== req.user.id) {
    const hasWriteAccess = await checkDelegatedAccess(req.user.id, targetUserId, 'FULL_ACCESS');
    if (!hasWriteAccess) {
      return res.status(403).json({ error: 'Unauthorized modification attempt' });
    }
  }

  const {
    fullName,
    dob,
    gender,
    bloodGroup,
    height,
    weight,
    emergencyContact,
    address,
    insuranceInfo
  } = req.body;

  try {
    // Check if profile already exists to maintain the healthId
    let existingProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId }
    });

    const dataPayload = {
      fullName: fullName || 'Name Not Provided',
      dob: encrypt(dob || ''),
      gender: encrypt(gender || ''),
      bloodGroup: encrypt(bloodGroup || ''),
      height: encrypt(height || ''),
      weight: encrypt(weight || ''),
      emergencyContact: encrypt(emergencyContact || ''),
      address: encrypt(address || ''),
      insuranceInfo: encrypt(insuranceInfo || ''),
      healthId: existingProfile ? existingProfile.healthId : generateHealthId()
    };

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: targetUserId },
      update: dataPayload,
      create: {
        userId: targetUserId,
        ...dataPayload
      }
    });

    await auditService.logEvent(req.user.id, 'PERMISSION_CHANGE', `Updated profile data for user ID ${targetUserId}`, req.ip);

    res.status(200).json({
      message: 'Profile saved successfully',
      healthId: updatedProfile.healthId
    });
  } catch (error) {
    console.error('❌ Update profile error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ==========================================
// ALLERGIES tracker API
// ==========================================

const getAllergies = async (req, res) => {
  const targetUserId = req.query.userId || req.user.id;
  try {
    const allergies = await prisma.allergy.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(allergies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch allergies' });
  }
};

const addAllergy = async (req, res) => {
  const targetUserId = req.body.userId || req.user.id;
  const { allergyType, allergen, severity, notes } = req.body;

  try {
    const allergy = await prisma.allergy.create({
      data: {
        userId: targetUserId,
        allergyType,
        allergen,
        severity,
        notes
      }
    });
    await auditService.logEvent(req.user.id, 'PERMISSION_CHANGE', `Added allergy: ${allergen}`, req.ip);
    res.status(201).json(allergy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record allergy' });
  }
};

const deleteAllergy = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.allergy.delete({ where: { id } });
    res.status(200).json({ message: 'Allergy profile removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete allergy log' });
  }
};

// ==========================================
// VACCINATIONS tracker API
// ==========================================

const getVaccinations = async (req, res) => {
  const targetUserId = req.query.userId || req.user.id;
  try {
    const vaccinations = await prisma.vaccination.findMany({
      where: { userId: targetUserId },
      orderBy: { dateAdministered: 'desc' }
    });
    res.status(200).json(vaccinations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vaccinations' });
  }
};

const addVaccination = async (req, res) => {
  const targetUserId = req.body.userId || req.user.id;
  const { vaccineName, doseNumber, dateAdministered, facilityName, reminderDate, notes } = req.body;

  try {
    const vaccination = await prisma.vaccination.create({
      data: {
        userId: targetUserId,
        vaccineName,
        doseNumber: parseInt(doseNumber),
        dateAdministered: new Date(dateAdministered),
        facilityName,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        notes
      }
    });
    res.status(201).json(vaccination);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record immunization' });
  }
};

const deleteVaccination = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.vaccination.delete({ where: { id } });
    res.status(200).json({ message: 'Vaccination entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vaccination' });
  }
};

// ==========================================
// DIAGNOSES tracker API
// ==========================================

const getDiagnoses = async (req, res) => {
  const targetUserId = req.query.userId || req.user.id;
  try {
    const diagnoses = await prisma.diagnosis.findMany({
      where: { userId: targetUserId },
      orderBy: { diagnosedDate: 'desc' }
    });
    res.status(200).json(diagnoses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clinical diagnoses' });
  }
};

const addDiagnosis = async (req, res) => {
  const targetUserId = req.body.userId || req.user.id;
  const { condition, diagnosedDate, status, notes } = req.body;

  try {
    const diagnosis = await prisma.diagnosis.create({
      data: {
        userId: targetUserId,
        condition,
        diagnosedDate: new Date(diagnosedDate),
        status,
        notes
      }
    });
    res.status(201).json(diagnosis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save diagnosis' });
  }
};

const deleteDiagnosis = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.diagnosis.delete({ where: { id } });
    res.status(200).json({ message: 'Diagnosis deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove diagnosis' });
  }
};

// ==========================================
// APPOINTMENTS API
// ==========================================

const getAppointments = async (req, res) => {
  const targetUserId = req.query.userId || req.user.id;
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { patientId: targetUserId },
          { doctor: { userId: targetUserId } }
        ]
      },
      include: {
        patient: {
          select: {
            email: true,
            profile: { select: { fullName: true } }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                email: true,
                profile: { select: { fullName: true } }
              }
            }
          }
        }
      },
      orderBy: { dateTime: 'asc' }
    });
    res.status(200).json(appointments);
  } catch (error) {
    console.error('❌ Appointments fetch error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve appointments list' });
  }
};

const createAppointment = async (req, res) => {
  const { doctorId, dateTime, notes } = req.body;
  const patientId = req.body.patientId || req.user.id;

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        dateTime: new Date(dateTime),
        status: 'SCHEDULED',
        notes
      }
    });
    res.status(201).json(appointment);
  } catch (error) {
    console.error('❌ Create appointment error:', error.message);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
};

const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    res.status(200).json({ message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// ==========================================
// PRIVILEGED ACCESS DELEGATION HELPERS
// ==========================================

const checkDelegatedAccess = async (actorUserId, targetUserId, minimumAccess = 'VIEW_ONLY') => {
  if (actorUserId === targetUserId) return true;

  // 1. Check family relationships
  const familyMember = await prisma.familyMember.findFirst({
    where: {
      userId: actorUserId,
      family: {
        primaryUserId: targetUserId
      }
    }
  });

  if (familyMember) {
    if (minimumAccess === 'FULL_ACCESS') {
      return familyMember.accessLevel === 'ADMIN' || familyMember.accessLevel === 'FULL_ACCESS';
    }
    return true; // Any member has at least VIEW_ONLY
  }

  // 2. Check doctor clinical consent
  const doctor = await prisma.doctor.findUnique({ where: { userId: actorUserId } });
  if (doctor) {
    const consent = await prisma.consent.findFirst({
      where: {
        userId: targetUserId,
        doctorUserId: actorUserId,
        expiresAt: { gt: new Date() }
      }
    });
    if (consent) return true;
  }

  return false;
};

module.exports = {
  getProfile,
  updateProfile,
  getAllergies,
  addAllergy,
  deleteAllergy,
  getVaccinations,
  addVaccination,
  deleteVaccination,
  getDiagnoses,
  addDiagnosis,
  deleteDiagnosis,
  getAppointments,
  createAppointment,
  cancelAppointment,
  checkDelegatedAccess
};
