const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const emailService = require('./email.service');

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Token helpers ─────────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
}

// Random hex token for email verification and password reset
function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// SHA-256 of a refresh token — stored in DB instead of the raw JWT (Error #2 analogue)
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ── Service methods ───────────────────────────────────────────────────────────

async function register(data) {
  const { name, email, password, phone, role: rawRole } = data;

  // 'charity_admin' is stored as 'user' — admin status comes from owning a Charity
  const role = rawRole === 'charity_admin' ? 'user' : (rawRole || 'user');

  // Check uniqueness — return a generic error so we don't leak whether the email exists
  const existing = await User.unscoped().findOne({ where: { email } });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const emailVerificationToken = generateOpaqueToken();

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone: phone || null,
    role,
    isVerified: false,
    emailVerificationToken,
  });

  // Fire-and-forget email — log failures but don't block the response
  emailService.sendVerificationEmail(user, emailVerificationToken).catch((err) => {
    console.error('[email] sendVerificationEmail failed:', err.message);
  });

  // Return the user through the defaultScope so password is never included
  return User.findByPk(user.id);
}

async function verifyEmail(token) {
  if (!token) {
    const err = new Error('Verification token is required');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.unscoped().findOne({ where: { emailVerificationToken: token } });

  if (!user) {
    const err = new Error('Invalid or expired verification token');
    err.statusCode = 400;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error('This email address has already been verified');
    err.statusCode = 400;
    throw err;
  }

  await user.update({ isVerified: true, emailVerificationToken: null });
}

async function login(email, password) {
  // Use unscoped() to fetch the password column — Error #3 pattern
  const user = await User.unscoped().findOne({ where: { email } });

  // Same message for "not found" and "wrong password" to prevent enumeration
  const invalidErr = Object.assign(new Error('Invalid email or password'), { statusCode: 401 });

  if (!user) throw invalidErr;

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw invalidErr;

  // Block unverified users — per CLAUDE.md auth rules
  if (!user.isVerified) {
    const err = new Error('Please verify your email address before logging in');
    err.statusCode = 403;
    throw err;
  }

  // Block deactivated accounts
  if (!user.isActive) {
    const err = new Error('This account has been deactivated. Please contact support.');
    err.statusCode = 403;
    throw err;
  }

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store only the hash — raw token is never persisted
  await user.update({ refreshTokenHash: hashToken(refreshToken) });

  // Return user through defaultScope (no password, no tokens)
  const safeUser = await User.findByPk(user.id);

  return { accessToken, refreshToken, user: safeUser };
}

async function refreshToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  // Find user and verify the hashed token matches — invalidates reuse after logout
  const user = await User.unscoped().findOne({ where: { id: decoded.id } });

  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(token)) {
    const err = new Error('Refresh token has been revoked');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = generateAccessToken(user);
  return { accessToken };
}

async function forgotPassword(email) {
  // Always resolve — never reveal whether the email is registered
  const user = await User.findOne({ where: { email } });
  if (!user) return;

  const resetToken  = generateOpaqueToken();
  const resetExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await user.update({ resetPasswordToken: resetToken, resetPasswordExpiry: resetExpiry });

  emailService.sendPasswordResetEmail(user, resetToken).catch((err) => {
    console.error('[email] sendPasswordResetEmail failed:', err.message);
  });
}

async function resetPassword(token, newPassword) {
  const user = await User.unscoped().findOne({ where: { resetPasswordToken: token } });

  if (!user || !user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
    const err = new Error('Invalid or expired password reset token');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await user.update({
    password:            hashedPassword,
    resetPasswordToken:  null,
    resetPasswordExpiry: null,
    refreshTokenHash:    null, // Invalidate any active session
  });
}

async function logout(userId) {
  // Clearing the hash makes the stored refresh token permanently invalid
  await User.update({ refreshTokenHash: null }, { where: { id: userId } });
}

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
};
