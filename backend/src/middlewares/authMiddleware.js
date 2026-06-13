const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'medihist-default-access-secret-key-199';

/**
 * Protects endpoints by verifying incoming access token.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    jwt.verify(token, JWT_ACCESS_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired access token' });
      }

      // Load user and associated roles/permissions
      const user = await prisma.user.findFirst({
        where: { id: decoded.userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user || user.deletedAt) {
        return res.status(404).json({ error: 'Authenticated user not found or has been soft-deleted' });
      }

      // Extract permissions list
      const permissions = [];
      user.userRoles.forEach((ur) => {
        ur.role.rolePermissions.forEach((rp) => {
          if (!permissions.includes(rp.permission.name)) {
            permissions.push(rp.permission.name);
          }
        });
      });

      // Attach user credentials to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role, // Enum role (PATIENT, DOCTOR, hospital, etc.)
        permissions
      };
      
      next();
    });
  } catch (error) {
    console.error('❌ Authentication middleware error:', error.message);
    res.status(500).json({ error: 'Internal security authentication failure' });
  }
};

module.exports = {
  authenticateToken
};
