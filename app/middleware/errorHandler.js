const { errorResponse } = require('../../utils/response');
const fs = require('fs');
const path = require('path');

function logError(err) {
  const logsDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const line = `[${new Date().toISOString()}] ${err.stack || err.message}\n`;
  fs.appendFileSync(path.join(logsDir, 'error.log'), line);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logError(err);

  // Sequelize validation / unique constraint
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json(errorResponse('Validation failed', errors));
  }

  // Sequelize FK / general DB error
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json(errorResponse('A database error occurred'));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Invalid token'));
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token has expired'));
  }

  // CORS
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json(errorResponse(err.message));
  }

  // Custom application errors (thrown with err.statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json(errorResponse(err.message));
  }

  // Fallback
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json(
    errorResponse(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    )
  );
}

module.exports = errorHandler;
