const prisma = require('../config/db');
const auditService = require('../services/auditService');

/**
 * Returns platform signups, records uploads, and role counts.
 */
const getPlatformAnalytics = async (req, res) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalHospitals,
      totalCaregivers,
      totalRecords,
      totalLogs
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PATIENT', deletedAt: null } }),
      prisma.user.count({ where: { role: 'DOCTOR', deletedAt: null } }),
      prisma.user.count({ where: { role: 'HOSPITAL', deletedAt: null } }),
      prisma.user.count({ where: { role: 'CAREGIVER', deletedAt: null } }),
      prisma.medicalRecord.count({ where: { deletedAt: null } }),
      prisma.auditLog.count()
    ]);

    // Categories breakdown
    const categoriesCount = await prisma.medicalRecord.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      where: { deletedAt: null }
    });

    // Resolve category names
    const resolvedCategories = await prisma.medicalCategory.findMany();
    const breakdown = resolvedCategories.map(cat => {
      const group = categoriesCount.find(c => c.categoryId === cat.id);
      return {
        name: cat.name,
        slug: cat.slug,
        count: group ? group._count.id : 0
      };
    });

    res.status(200).json({
      metrics: {
        patients: totalPatients,
        doctors: totalDoctors,
        hospitals: totalHospitals,
        caregivers: totalCaregivers,
        records: totalRecords,
        auditLogs: totalLogs
      },
      categoryBreakdown: breakdown
    });
  } catch (error) {
    console.error('❌ Failed to load admin analytics:', error.message);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
};

/**
 * Lists audit trails with filtering options.
 */
const getAuditLogsList = async (req, res) => {
  const { action, userId, search, page, limit } = req.query;
  try {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;

    const data = await auditService.getLogs({ action, userId, search }, limitNum, pageNum);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve audit log listings' });
  }
};

/**
 * Lists all user accounts.
 */
const getUsersList = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Decrypt user profile names and details
    const decryptedUsers = users.map(user => {
      const decryptedProfile = user.profile ? {
        fullName: user.profile.fullName,
        healthId: user.profile.healthId
      } : null;

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
        profile: decryptedProfile
      };
    });

    res.status(200).json(decryptedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
};

/**
 * Toggles a user's deletedAt status (ban/unban user).
 */
const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { ban } = req.body;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'ADMIN') {
      return res.status(400).json({ error: 'Admin statuses cannot be modified' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: ban ? new Date() : null
      }
    });

    await auditService.logEvent(req.user.id, 'PERMISSION_CHANGE', `${ban ? 'Deactivated' : 'Reactivated'} user account email: ${targetUser.email}`, req.ip);

    res.status(200).json({
      message: `User has been successfully ${ban ? 'deactivated' : 'reactivated'}`,
      user: { id: updatedUser.id, email: updatedUser.email, deletedAt: updatedUser.deletedAt }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user account status' });
  }
};

module.exports = {
  getPlatformAnalytics,
  getAuditLogsList,
  getUsersList,
  toggleUserStatus
};
