const prisma = require('../config/db');
const { decrypt } = require('../services/cryptoService');
const crypto = require('crypto');
const auditService = require('../services/auditService');

/**
 * Fetches user's emergency card details or initializes a new card.
 */
const getEmergencyCard = async (req, res) => {
  try {
    let card = await prisma.emergencyCard.findUnique({
      where: { userId: req.user.id }
    });

    if (!card) {
      const slug = crypto.randomBytes(12).toString('hex');
      card = await prisma.emergencyCard.create({
        data: {
          userId: req.user.id,
          publicProfileSlug: slug,
          qrCodeUrl: `/emergency/public/${slug}`, // Relative path mapping frontend routing
          isPublicActive: true
        }
      });
    }

    // Load active critical markers
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    const allergies = await prisma.allergy.findMany({ where: { userId: req.user.id } });
    const diagnoses = await prisma.diagnosis.findMany({ where: { userId: req.user.id, status: 'ACTIVE' } });

    const decryptedInfo = {
      card,
      criticalInfo: {
        fullName: profile ? profile.fullName : 'Not Configured',
        bloodGroup: profile ? decrypt(profile.bloodGroup) : 'Not Configured',
        emergencyContact: profile ? decrypt(profile.emergencyContact) : 'Not Configured',
        allergies: allergies.map(a => ({ allergen: a.allergen, severity: a.severity, type: a.allergyType })),
        conditions: diagnoses.map(d => d.condition)
      }
    };

    res.status(200).json(decryptedInfo);
  } catch (error) {
    console.error('❌ Get emergency card error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve emergency details' });
  }
};

/**
 * Toggles whether the public emergency portal page is accessible.
 */
const toggleEmergencyActive = async (req, res) => {
  const { isPublicActive } = req.body;

  try {
    const card = await prisma.emergencyCard.update({
      where: { userId: req.user.id },
      data: { isPublicActive: !!isPublicActive }
    });

    await auditService.logEvent(req.user.id, 'PERMISSION_CHANGE', `Toggled emergency profile access to: ${card.isPublicActive}`, req.ip);

    res.status(200).json({ message: 'Emergency card updated', card });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update emergency card state' });
  }
};

/**
 * Public, read-only endpoint accessed by emergency responders scanning the QR code
 * Does NOT require authentication.
 */
const getPublicProfile = async (req, res) => {
  const { slug } = req.params;

  try {
    const card = await prisma.emergencyCard.findUnique({
      where: { publicProfileSlug: slug }
    });

    if (!card) {
      return res.status(404).json({ error: 'Emergency profile card not found' });
    }

    if (!card.isPublicActive) {
      return res.status(403).json({ error: 'This emergency profile has been deactivated by the patient.' });
    }

    // Resolve associated user profile & items
    const user = await prisma.user.findUnique({
      where: { id: card.userId },
      include: {
        profile: true,
        allergies: true,
        diagnoses: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Patient account associated with this card does not exist' });
    }

    // Extract ONLY life-saving data.
    // Address, insurance details, and login creds are strictly OMITTED.
    const publicProfile = {
      fullName: user.profile ? user.profile.fullName : 'Not Configured',
      bloodGroup: user.profile ? decrypt(user.profile.bloodGroup) : 'Not Configured',
      emergencyContact: user.profile ? decrypt(user.profile.emergencyContact) : 'Not Configured',
      allergies: user.allergies.map(a => ({
        allergen: a.allergen,
        severity: a.severity,
        type: a.allergyType,
        notes: a.notes
      })),
      chronicConditions: user.diagnoses.map(d => ({
        condition: d.condition,
        diagnosedDate: d.diagnosedDate
      })),
      lastUpdated: card.updatedAt
    };

    // Log the public emergency access event!
    await auditService.logEvent(card.userId, 'RECORD_ACCESS', `EMERGENCY CARD ACCESSED PUBLICLY via IP`, req.ip);

    res.status(200).json(publicProfile);
  } catch (error) {
    console.error('❌ Public profile search failure:', error.message);
    res.status(500).json({ error: 'Failed to load emergency profile details' });
  }
};

module.exports = {
  getEmergencyCard,
  toggleEmergencyActive,
  getPublicProfile
};
