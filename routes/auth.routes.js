const router = require('express').Router();
const validate = require('../app/middleware/validate');
const { verifyToken } = require('../app/middleware/auth');
const authController = require('../app/controllers/auth.controller');
const {
  registerRules,
  loginRules,
  refreshTokenRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require('../app/validators/auth.validator');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     description: >
 *       Creates a new user. Use `role: charity_admin` if registering to manage a charity.
 *       No email verification required — you can log in immediately after registration.
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
 *         description: Registration successful — log in immediately with your credentials.
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
router.post('/register', registerRules, validate, authController.register);

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
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/login', loginRules, validate, authController.login);

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
router.post('/refresh-token', refreshTokenRules, validate, authController.refreshToken);

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
router.post('/forgot-password', forgotPasswordRules, validate, authController.forgotPassword);

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
router.post('/reset-password', resetPasswordRules, validate, authController.resetPassword);

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
