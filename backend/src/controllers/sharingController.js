const prisma = require('../config/db');
const mailService = require('../services/mailService');
const auditService = require('../services/auditService');

// ==========================================
// DOCTOR SHARING ACCESS CONSENTS
// ==========================================

const getDoctorAccesses = async (req, res) => {
  try {
    const accesses = await prisma.doctorAccess.findMany({
      where: { patientId: req.user.id },
      include: {
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
      orderBy: { grantedAt: 'desc' }
    });
    res.status(200).json(accesses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor access consent records' });
  }
};

const grantDoctorAccess = async (req, res) => {
  const { doctorEmail, permissions, expiryDate } = req.body;

  if (!doctorEmail || !expiryDate) {
    return res.status(400).json({ error: 'Doctor email and expiry date are required' });
  }

  try {
    // 1. Resolve Doctor User Account
    const doctorUser = await prisma.user.findFirst({
      where: { email: doctorEmail.toLowerCase().trim(), role: 'DOCTOR' },
      include: { doctor: true }
    });

    if (!doctorUser || !doctorUser.doctor) {
      return res.status(404).json({ error: 'No verified doctor account found with this email' });
    }

    // 2. Create Consent & DoctorAccess Entry
    const expiry = new Date(expiryDate);
    
    // Check if access already exists
    const existingAccess = await prisma.doctorAccess.findFirst({
      where: {
        patientId: req.user.id,
        doctorId: doctorUser.doctor.id,
        revokedAt: null,
        expiryDate: { gt: new Date() }
      }
    });

    if (existingAccess) {
      return res.status(400).json({ error: 'Active access is already granted to this doctor' });
    }

    const consent = await prisma.consent.create({
      data: {
        userId: req.user.id,
        doctorUserId: doctorUser.id,
        permissions: permissions || ['read'],
        expiresAt: expiry
      }
    });

    const access = await prisma.doctorAccess.create({
      data: {
        patientId: req.user.id,
        doctorId: doctorUser.doctor.id,
        expiryDate: expiry
      }
    });

    // 3. Send email to doctor
    const patientProfile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    const patientName = patientProfile ? patientProfile.fullName : req.user.email;
    
    await mailService.sendAccessGrantedEmail(doctorEmail, patientName, expiryDate);
    
    // Audit check
    await auditService.logEvent(req.user.id, 'PERMISSION_CHANGE', `Granted record access to Doctor: ${doctorEmail} (expires: ${expiry.toLocaleDateString()})`, req.ip);

    res.status(201).json({
      message: `Access consent granted successfully to Dr. ${patientName}`,
      access
    });
  } catch (error) {
    console.error('❌ Grant access error:', error.message);
    res.status(500).json({ error: 'Failed to authorize doctor access' });
  }
};

const revokeDoctorAccess = async (req, res) => {
  const { id } = req.params;

  try {
    const access = await prisma.doctorAccess.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } } }
    });

    if (!access) {
      return res.status(404).json({ error: 'Consent access record not found' });
    }

    if (access.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized revocation action' });
    }

    // Revoke access
    await prisma.doctorAccess.update({
      where: { id },
      data: { revokedAt: new Date(), accessGranted: false }
    });

    // Invalidate Consent model
    await prisma.consent.deleteMany({
      where: {
        userId: req.user.id,
        doctorUserId: access.doctor.userId
      }
    });

    await auditService.logEvent(req.user.id, 'PERMISSION_CHANGE', `Revoked medical records access for Doctor User ID: ${access.doctor.userId}`, req.ip);

    res.status(200).json({ message: 'Access authorization revoked successfully' });
  } catch (error) {
    console.error('❌ Revoke access error:', error.message);
    res.status(500).json({ error: 'Failed to revoke doctor access' });
  }
};

// ==========================================
// FAMILY ACCOUNTS
// ==========================================

const getFamily = async (req, res) => {
  try {
    // Find family owned by this user
    let family = await prisma.family.findFirst({
      where: { primaryUserId: req.user.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                email: true,
                profile: { select: { fullName: true, healthId: true } }
              }
            }
          }
        }
      }
    });

    // If they don't own one, find families they belong to
    if (!family) {
      const membership = await prisma.familyMember.findFirst({
        where: { userId: req.user.id },
        include: {
          family: {
            include: {
              primaryUser: {
                select: {
                  email: true,
                  profile: { select: { fullName: true } }
                }
              },
              members: {
                include: {
                  user: {
                    select: {
                      email: true,
                      profile: { select: { fullName: true } }
                    }
                  }
                }
              }
            }
          }
        }
      });
      family = membership ? membership.family : null;
    }

    res.status(200).json(family);
  } catch (error) {
    console.error('❌ Get family error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve family details' });
  }
};

const addFamilyMember = async (req, res) => {
  const { email, relation, accessLevel } = req.body;

  if (!email || !relation || !accessLevel) {
    return res.status(400).json({ error: 'Member email, relation, and access level are required' });
  }

  try {
    // 1. Resolve family group or create one
    let family = await prisma.family.findFirst({
      where: { primaryUserId: req.user.id }
    });

    if (!family) {
      const patientProfile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
      const name = patientProfile ? `${patientProfile.fullName}'s Family` : 'My Family Group';
      family = await prisma.family.create({
        data: {
          primaryUserId: req.user.id,
          name
        }
      });
    }

    // 2. Resolve target member user
    const memberUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!memberUser) {
      return res.status(404).json({ error: 'No registered user found with this email. Dependents must create accounts first.' });
    }

    if (memberUser.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot add yourself as a family dependent' });
    }

    // 3. Add family link
    const existingMember = await prisma.familyMember.findFirst({
      where: { familyId: family.id, userId: memberUser.id }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'This user is already added to your family group' });
    }

    const newMember = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId: memberUser.id,
        relation,
        accessLevel
      }
    });

    await auditService.logEvent(req.user.id, 'PERMISSION_CHANGE', `Added family member: ${email} as ${relation}`, req.ip);

    res.status(201).json({
      message: 'Family member linked successfully',
      member: newMember
    });
  } catch (error) {
    console.error('❌ Add family member error:', error.message);
    res.status(500).json({ error: 'Failed to link family member' });
  }
};

const deleteFamilyMember = async (req, res) => {
  const { id } = req.params;

  try {
    const member = await prisma.familyMember.findUnique({
      where: { id },
      include: { family: true }
    });

    if (!member) {
      return res.status(404).json({ error: 'Family member record not found' });
    }

    // Must be family owner or the member themselves
    if (member.family.primaryUserId !== req.user.id && member.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to remove this family link' });
    }

    await prisma.familyMember.delete({ where: { id } });

    await auditService.logEvent(req.user.id, 'PERMISSION_CHANGE', `Deleted family member link for ID ${member.userId}`, req.ip);

    res.status(200).json({ message: 'Family member removed successfully' });
  } catch (error) {
    console.error('❌ Delete family member error:', error.message);
    res.status(500).json({ error: 'Failed to remove family member' });
  }
};

module.exports = {
  getDoctorAccesses,
  grantDoctorAccess,
  revokeDoctorAccess,
  getFamily,
  addFamilyMember,
  deleteFamilyMember
};
