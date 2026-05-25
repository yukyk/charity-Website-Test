const { body, param, query } = require('express-validator');

const CATEGORIES = ['education', 'health', 'environment', 'poverty', 'disaster', 'animals', 'other'];

const listCharitiesRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(CATEGORIES),
  query('location').optional().trim(),
  query('search').optional().trim(),
];

const getCharityRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
];

const createCharityRules = [
  body('name').trim().notEmpty().withMessage('Charity name required'),
  body('email').isEmail().normalizeEmail(),
  body('description').optional().trim(),
  body('mission').optional().trim(),
  body('category').isIn(CATEGORIES).withMessage('Invalid category'),
  body('location').optional().trim(),
  body('registrationNumber').optional().trim(),
  body('goalAmount').optional().isDecimal(),
  body('websiteUrl').optional().isURL(),
];

const updateCharityRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('mission').optional().trim(),
  body('category').optional().isIn(CATEGORIES),
  body('location').optional().trim(),
  body('goalAmount').optional().isDecimal(),
  body('websiteUrl').optional().isURL(),
];

const addProjectRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
  body('title').trim().notEmpty().withMessage('Project title required'),
  body('description').optional().trim(),
  body('targetAmount').isDecimal().withMessage('Target amount required'),
  body('imageUrl').optional().isURL(),
];

const updateProjectRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
  param('pid').isUUID(4).withMessage('Invalid project ID'),
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('targetAmount').optional().isDecimal(),
  body('status').optional().isIn(['active', 'completed', 'paused']),
];

const charityDonationsRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
];

const addImpactReportRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
  body('title').trim().notEmpty().withMessage('Report title required'),
  body('content').trim().notEmpty().withMessage('Report content required'),
  body('imageUrl').optional().isURL(),
];

const listImpactReportsRules = [
  param('id').isUUID(4).withMessage('Invalid charity ID'),
];

module.exports = {
  listCharitiesRules,
  getCharityRules,
  createCharityRules,
  updateCharityRules,
  addProjectRules,
  updateProjectRules,
  charityDonationsRules,
  addImpactReportRules,
  listImpactReportsRules,
};
