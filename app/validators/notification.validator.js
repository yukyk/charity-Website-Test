const { param, query } = require('express-validator');

const listNotificationsRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const markReadRules = [
  param('id').isUUID(4).withMessage('Invalid notification ID'),
];

module.exports = { listNotificationsRules, markReadRules };
