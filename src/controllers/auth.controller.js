const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(
      successResponse(user, 'Registration successful. Please check your email to verify your account.')
    );
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    // Token may arrive from query string (?token=) or request body
    const token = req.query.token || req.body.token;
    await authService.verifyEmail(token);
    res.json(successResponse(null, 'Email verified successfully. You can now log in.'));
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(successResponse(result, 'Login successful.'));
  } catch (err) {
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json(successResponse(result, 'Access token refreshed.'));
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);
    // Always return the same message — never reveal whether the email exists
    res.json(successResponse(null, 'If an account with that email exists, a reset link has been sent.'));
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json(successResponse(null, 'Password reset successfully. Please log in with your new password.'));
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    res.json(successResponse(null, 'Logged out successfully.'));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, verifyEmail, login, refreshToken, forgotPassword, resetPassword, logout };
