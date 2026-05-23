const router = require('express').Router();
const { body, check } = require('express-validator');
const validate = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     description: >
 *       Creates a new user. Use `role: charity_admin` if registering to manage a charity.
 *       A verification email is sent automatically — the account cannot log in until verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: securepass123
 *               role:
 *                 type: string
 *                 enum: [user, charity_admin]
 *                 default: user
 *                 description: "`charity_admin` enables charity registration after login."
 *               phone:
 *                 type: string
 *                 example: "+91-9876543210"
 *     responses:
 *       201:
 *         description: Registration successful — verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/register',
  [
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
  ],
  validate,
  authController.register
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify a user's email address
 *     tags: [Auth]
 *     description: >
 *       Accepts the one-time token sent in the welcome email.
 *       The token can be passed in the request body **or** as a `?token=` query string
 *       (the frontend may receive it as a query param when the user clicks the link).
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Verification token (alternative to body).
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: a3f8c2e1d94b7e6f5a1b2c3d4e5f6789a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Token invalid or expired.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/verify-email',
  [check('token').notEmpty().withMessage('Verification token required')],
  validate,
  authController.verifyEmail
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive tokens
 *     tags: [Auth]
 *     description: >
 *       Returns a short-lived **access token** (15 min) and a long-lived **refresh token** (7 days).
 *       Store the access token in memory; store the refresh token in an httpOnly cookie or secure storage.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 example: securepass123
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiJ9...
 *                         refreshToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiJ9...
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials or email not verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  authController.login
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Get a new access token using a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiJ9...
 *     responses:
 *       200:
 *         description: New access token issued.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiJ9...
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty().withMessage('Refresh token required')],
  validate,
  authController.refreshToken
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 *     description: >
 *       Always returns 200 regardless of whether the email exists — prevents user enumeration.
 *       If an account is found, a reset link valid for 1 hour is sent to the email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *     responses:
 *       200:
 *         description: Reset email sent (or silently ignored if email not found).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  validate,
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a reset token
 *     tags: [Auth]
 *     description: >
 *       Requires the token from the reset-password email link. On success, all active
 *       sessions (refresh tokens) are invalidated and the user must log in again.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 example: a3f8c2e1d94b7e6f5a1b2c3d4e5f6789a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: newSecurePass456
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Token invalid or expired.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validate,
  authController.resetPassword
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and invalidate the current refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
