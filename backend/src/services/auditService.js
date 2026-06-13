const prisma = require('../config/db');

/**
 * Creates an audit log entry in the database.
 * @param {string|null} userId ID of user performing action
 * @param {string} action Category of action (LOGIN, LOGOUT, RECORD_ACCESS, RECORD_DOWNLOAD, PERMISSION_CHANGE)
 * @param {string} details Detailed text description
 * @param {string} ipAddress IP address of client
 */
const logEvent = async (userId, action, details, ipAddress = '0.0.0.0') => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        details,
        ipAddress
      }
    });
    return log;
  } catch (error) {
    // Gracefully handle logging error so core transaction doesn't fail
    console.error('❌ Audit log creation failed:', error.message);
    return null;
  }
};

/**
 * Retrieves audit logs based on parameters.
 * @param {object} filters Query parameters
 * @returns {Promise<Array>} Array of log items
 */
const getLogs = async (filters = {}, limit = 100, page = 1) => {
  try {
    const skip = (page - 1) * limit;
    const queryConditions = {};

    if (filters.userId) {
      queryConditions.userId = filters.userId;
    }
    if (filters.action) {
      queryConditions.action = filters.action;
    }
    if (filters.search) {
      queryConditions.details = {
        contains: filters.search,
        mode: 'insensitive'
      };
    }

    const [logs, count] = await Promise.all([
      prisma.auditLog.findMany({
        where: queryConditions,
        take: limit,
        skip: skip,
        orderBy: {
          timestamp: 'desc'
        },
        include: {
          user: {
            select: {
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where: queryConditions })
    ]);

    return { logs, count, totalPages: Math.ceil(count / limit) };
  } catch (error) {
    console.error('❌ Failed to retrieve audit logs:', error.message);
    throw new Error('Could not fetch audit logs');
  }
};

module.exports = {
  logEvent,
  getLogs
};
