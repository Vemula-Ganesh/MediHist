const prisma = require('../config/db');
const { uploadFile, deleteFile } = require('../config/cloudinary');
const aiService = require('../services/aiService');
const auditService = require('../services/auditService');
const fs = require('fs');

/**
 * Lists all active medical records for the user, sorted chronologically for the timeline.
 */
const getRecords = async (req, res) => {
  const targetUserId = req.query.userId || req.user.id;
  const { categorySlug, search } = req.query;

  try {
    // Access permission check (family or doctor)
    if (targetUserId !== req.user.id) {
      const { checkDelegatedAccess } = require('./profileController');
      const hasAccess = await checkDelegatedAccess(req.user.id, targetUserId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access to these medical records is unauthorized' });
      }
    }

    const whereClause = {
      userId: targetUserId,
      deletedAt: null
    };

    if (categorySlug) {
      whereClause.category = {
        slug: categorySlug
      };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const records = await prisma.medicalRecord.findMany({
      where: whereClause,
      include: {
        category: true,
        doctor: {
          include: {
            user: { select: { profile: { select: { fullName: true } } } }
          }
        }
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });

    // Write audit event
    if (targetUserId !== req.user.id) {
      await auditService.logEvent(req.user.id, 'RECORD_ACCESS', `Viewed record timeline of user ${targetUserId}`, req.ip);
    }

    res.status(200).json(records);
  } catch (error) {
    console.error('❌ Get records error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve records' });
  }
};

/**
 * Uploads a document, saves details, and runs OpenAI summarization
 */
const uploadRecord = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { title, description, categorySlug, doctorId, facilityId, notes } = req.body;
  const targetUserId = req.body.userId || req.user.id;

  try {
    // 1. Resolve Category
    const category = await prisma.medicalCategory.findUnique({
      where: { slug: categorySlug || 'lab-report' }
    });

    if (!category) {
      return res.status(400).json({ error: 'Invalid medical category' });
    }

    // 2. Upload file
    const uploadResult = await uploadFile(req.file.path);

    // Clean up temporary local file if it was successfully moved
    if (fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('⚠️ Failed to delete temp upload file:', err.message);
      }
    }

    // 3. Trigger AI summarizer
    // If OCR is not implemented, we pass the title and description to extract trends
    const aiSummary = await aiService.summarizeReport(title, description);

    // 4. Create Medical Record in DB
    const record = await prisma.medicalRecord.create({
      data: {
        userId: targetUserId,
        title,
        description,
        categoryId: category.id,
        recordUrl: uploadResult.url,
        recordType: req.file.mimetype.includes('pdf') ? 'PDF' : 'IMAGE',
        doctorId: doctorId || null,
        facilityId: facilityId || null,
        notes,
        summary: aiSummary.summary,
        keyFindings: aiSummary.keyFindings,
        followUpRecommendations: aiSummary.followUpRecommendations
      },
      include: {
        category: true
      }
    });

    // Write audit
    await auditService.logEvent(req.user.id, 'WRITE_RECORDS', `Uploaded medical record: ${title} (${record.id})`, req.ip);

    res.status(201).json({
      message: 'Medical record uploaded and analyzed successfully',
      record
    });
  } catch (error) {
    console.error('❌ Upload record error:', error.message);
    res.status(500).json({ error: 'Failed to upload and analyze record' });
  }
};

/**
 * Soft deletes a medical record
 */
const deleteRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await prisma.medicalRecord.findUnique({ where: { id } });

    if (!record || record.deletedAt) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Patients can delete their own; admins can also manage
    if (record.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized delete action' });
    }

    await prisma.medicalRecord.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await auditService.logEvent(req.user.id, 'DELETE_RECORDS', `Deleted medical record id ${id}`, req.ip);

    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('❌ Delete record error:', error.message);
    res.status(500).json({ error: 'Failed to delete record' });
  }
};

/**
 * Downloads a document (logs access/download audit trails)
 */
const downloadRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!record || record.deletedAt) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Check permissions
    if (record.userId !== req.user.id) {
      const { checkDelegatedAccess } = require('./profileController');
      const hasAccess = await checkDelegatedAccess(req.user.id, record.userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Unauthorized download' });
      }
    }

    // Write audit event
    await auditService.logEvent(req.user.id, 'RECORD_DOWNLOAD', `Downloaded record: ${record.title} (${record.id})`, req.ip);

    res.status(200).json({ url: record.recordUrl });
  } catch (error) {
    console.error('❌ Download audit error:', error.message);
    res.status(500).json({ error: 'Failed to download record' });
  }
};

/**
 * AI Smart Search: translates a natural language prompt into filters
 */
const smartSearch = async (req, res) => {
  const { query, userId } = req.body;
  const targetUserId = userId || req.user.id;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // Classify query using AI Service
    const aiFilters = await aiService.classifyQuery(query);
    console.log('💡 AI Smart Search Query Classified:', aiFilters);

    // Build database search queries based on classified output
    const dbQuery = {
      userId: targetUserId,
      deletedAt: null
    };

    if (aiFilters.categorySlug) {
      dbQuery.category = { slug: aiFilters.categorySlug };
    }

    const searchConditions = [];
    if (aiFilters.keywords && aiFilters.keywords.length > 0) {
      aiFilters.keywords.forEach(kw => {
        searchConditions.push(
          { title: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
          { notes: { contains: kw, mode: 'insensitive' } }
        );
      });
      dbQuery.OR = searchConditions;
    }

    if (aiFilters.yearFilter) {
      const startYear = new Date(`${aiFilters.yearFilter}-01-01T00:00:00.000Z`);
      const endYear = new Date(`${aiFilters.yearFilter}-12-31T23:59:59.999Z`);
      dbQuery.uploadDate = {
        gte: startYear,
        lte: endYear
      };
    }

    const records = await prisma.medicalRecord.findMany({
      where: dbQuery,
      include: { category: true },
      orderBy: { uploadDate: 'desc' }
    });

    await auditService.logEvent(req.user.id, 'RECORD_ACCESS', `AI Smart Search: "${query}"`, req.ip);

    res.status(200).json({
      query,
      filtersUsed: aiFilters,
      records
    });
  } catch (error) {
    console.error('❌ AI Smart Search Error:', error.message);
    res.status(500).json({ error: 'AI Smart search execution failed' });
  }
};

/**
 * Lists categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.medicalCategory.findMany();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

module.exports = {
  getRecords,
  uploadRecord,
  deleteRecord,
  downloadRecord,
  smartSearch,
  getCategories
};
