// src/middleware/authorize.js
/**
 * Role-based authorization middleware.
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'moderator')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

export default authorize;