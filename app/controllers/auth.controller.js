const authService = require('../services/auth.service');
const { successResponse } = require('../../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(
        successResponse(user, 'Registration successful. You can now log in.')
      );
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(successResponse(result, 'Login successful.'));
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      res.json(successResponse(result, 'Access token refreshed.'));
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.body.email);
      // Always return the same message — never reveal whether the email exists
      res.json(successResponse(null, 'If an account with that email exists, a reset link has been sent.'));
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.json(successResponse(null, 'Password reset successfully. Please log in with your new password.'));
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      res.json(successResponse(null, 'Logged out successfully.'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
