const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  // 'charity_admin' maps to role 'user' who will later own a Charity record
  body('role')
    .optional()
    .isIn(['user', 'charity_admin'])
    .withMessage('Role must be user or charity_admin'),
  body('phone').optional().trim(),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const refreshTokenRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];

module.exports = {
  registerRules,
  loginRules,
  refreshTokenRules,
  forgotPasswordRules,
  resetPasswordRules,
};
