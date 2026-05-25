const { body, param, query } = require('express-validator');

const listCharitiesRules = [
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const approveCharityRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
];

const rejectCharityRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
  body('adminNote').trim().notEmpty().withMessage('Rejection reason required'),
];

const listUsersRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
];

const deactivateUserRules = [
  param('id').isUUID(4).withMessage('Invalid user ID'),
];

const listDonationsRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']),
  query('charityId').optional().isUUID(4),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

module.exports = {
  listCharitiesRules,
  approveCharityRules,
  rejectCharityRules,
  listUsersRules,
  deactivateUserRules,
  listDonationsRules,
};
