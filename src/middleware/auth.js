const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

/**
 * Verifies the Bearer access token and attaches req.user = { id, role }
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse('Access token required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('Access token expired'));
    }
    return res.status(401).json(errorResponse('Invalid access token'));
  }
}

module.exports = { verifyToken };
