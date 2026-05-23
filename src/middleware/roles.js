const { errorResponse } = require('../utils/response');

/**
 * requireRole('admin') — only lets through users whose role matches.
 * Use AFTER verifyToken.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('Forbidden: insufficient permissions'));
    }
    next();
  };
}

module.exports = { requireRole };
