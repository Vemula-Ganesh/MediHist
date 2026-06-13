const prisma = require('../config/db');

const getMedications = async (req, res) => {
  const targetUserId = req.query.userId || req.user.id;
  try {
    const meds = await prisma.medication.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(meds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medications list' });
  }
};

const addMedication = async (req, res) => {
  const targetUserId = req.body.userId || req.user.id;
  const { name, dosage, frequency, duration, reminders, refillsLeft } = req.body;

  try {
    const med = await prisma.medication.create({
      data: {
        userId: targetUserId,
        name,
        dosage,
        frequency,
        duration,
        reminders: reminders !== undefined ? reminders : true,
        refillsLeft: refillsLeft !== undefined ? parseInt(refillsLeft) : 3,
        adherence: 100
      }
    });
    res.status(201).json(med);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save medication entry' });
  }
};

const updateMedication = async (req, res) => {
  const { id } = req.params;
  const { name, dosage, frequency, duration, reminders, refillsLeft, adherence } = req.body;

  try {
    const med = await prisma.medication.update({
      where: { id },
      data: {
        name,
        dosage,
        frequency,
        duration,
        reminders,
        refillsLeft: refillsLeft !== undefined ? parseInt(refillsLeft) : undefined,
        adherence: adherence !== undefined ? parseInt(adherence) : undefined
      }
    });
    res.status(200).json(med);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update medication entry' });
  }
};

const deleteMedication = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.medication.delete({ where: { id } });
    res.status(200).json({ message: 'Medication entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove medication entry' });
  }
};

module.exports = {
  getMedications,
  addMedication,
  updateMedication,
  deleteMedication
};
