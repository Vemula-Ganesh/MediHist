const prisma = require('../config/db');
const aiService = require('../services/aiService');

/**
 * Gathers clinical timeline items and requests comprehensive AI summaries.
 */
const getTimelineInsights = async (req, res) => {
  const targetUserId = req.query.userId || req.user.id;

  try {
    // 1. Gather all patient files (un-deleted)
    const records = await prisma.medicalRecord.findMany({
      where: { userId: targetUserId, deletedAt: null },
      orderBy: { uploadDate: 'desc' }
    });

    // 2. Gather active medications
    const medications = await prisma.medication.findMany({
      where: { userId: targetUserId }
    });

    // 3. Request insights
    const insights = await aiService.generateTimelineInsights(records, medications);

    // 4. Log/Cache the generated insight
    const savedInsight = await prisma.aIInsight.create({
      data: {
        userId: targetUserId,
        healthTrends: insights.healthTrends,
        riskIndicators: insights.riskIndicators,
        medicationAdherence: insights.medicationAdherence
      }
    });

    res.status(200).json(savedInsight);
  } catch (error) {
    console.error('❌ Failed to construct timeline insights:', error.message);
    res.status(500).json({ error: 'AI timeline insights analysis execution failed' });
  }
};

module.exports = {
  getTimelineInsights
};
