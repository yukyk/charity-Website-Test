const { body, param } = require('express-validator');

const updateProfileRules = [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

const donationReceiptRules = [
  param('id').isUUID(4).withMessage('Invalid donation ID'),
];

module.exports = { updateProfileRules, changePasswordRules, donationReceiptRules };
