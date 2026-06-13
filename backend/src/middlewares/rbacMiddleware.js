/**
 * Restricts access to specific role enums
 * @param {Array<string>|string} allowedRoles Allowed role enums
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Authorized roles: [${roles.join(', ')}]. Current role: ${req.user.role}` 
      });
    }

    next();
  };
};

/**
 * Restricts access to users holding specific permission names
 * @param {string} permission Permission string identifier
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: `Access denied. Required permission: ${permission}` 
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requirePermission
};
