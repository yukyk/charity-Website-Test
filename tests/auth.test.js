const request = require('supertest');
const app     = require('../src/app');
const { sequelize, User } = require('../src/models');

// Mock email service — we test API behaviour, not SendGrid delivery
jest.mock('../src/services/email.service', () => ({
  sendVerificationEmail:  jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendDonationConfirmation: jest.fn().mockResolvedValue(undefined),
  sendCharityApproved:    jest.fn().mockResolvedValue(undefined),
  sendCharityRejected:    jest.fn().mockResolvedValue(undefined),
  sendImpactReport:       jest.fn().mockResolvedValue(undefined),
}));

const BASE = '/api/v1/auth';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

// ── Register ──────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('201 — creates a new user and returns safe profile', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name:     'Jane Doe',
      email:    'jane@example.com',
      password: 'securepass123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('jane@example.com');
    expect(res.body.data.isVerified).toBe(false);
    expect(res.body.data.password).toBeUndefined();
  });

  it('422 — rejects password shorter than 8 characters', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Bad User', email: 'bad@example.com', password: 'short',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('422 — rejects invalid email', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Bad User', email: 'not-an-email', password: 'validpass123',
    });
    expect(res.status).toBe(422);
  });

  it('409 — rejects duplicate email', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Jane Dup', email: 'jane@example.com', password: 'securepass123',
    });
    expect(res.status).toBe(409);
  });
});

// ── Verify Email ──────────────────────────────────────────────────────────────

describe('POST /auth/verify-email', () => {
  it('200 — accepts the verification token sent on registration', async () => {
    const dbUser = await User.unscoped().findOne({ where: { email: 'jane@example.com' } });
    const res = await request(app)
      .post(`${BASE}/verify-email`)
      .send({ token: dbUser.emailVerificationToken });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('400 — rejects an invalid token', async () => {
    const res = await request(app)
      .post(`${BASE}/verify-email`)
      .send({ token: 'completely-invalid-token-xyz' });
    expect(res.status).toBe(400);
  });

  it('422 — rejects a missing token', async () => {
    const res = await request(app).post(`${BASE}/verify-email`).send({});
    expect(res.status).toBe(422);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('403 — blocks login for unverified user', async () => {
    // Register a fresh unverified user
    await request(app).post(`${BASE}/register`).send({
      name: 'Unverified User', email: 'unverified@example.com', password: 'securepass123',
    });
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'unverified@example.com', password: 'securepass123' });
    expect(res.status).toBe(403);
  });

  it('200 — returns accessToken + refreshToken for verified user', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'jane@example.com', password: 'securepass123' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('401 — rejects wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'jane@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('401 — rejects non-existent email', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@example.com', password: 'somepass123' });
    expect(res.status).toBe(401);
  });
});

// ── Refresh Token ─────────────────────────────────────────────────────────────

describe('POST /auth/refresh-token', () => {
  let refreshToken;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'jane@example.com', password: 'securepass123' });
    refreshToken = res.body.data.refreshToken;
  });

  it('200 — issues a new access token from a valid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh-token`)
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('401 — rejects a malformed / invalid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh-token`)
      .send({ refreshToken: 'totally.invalid.token' });
    expect(res.status).toBe(401);
  });

  it('422 — rejects a missing refresh token', async () => {
    const res = await request(app).post(`${BASE}/refresh-token`).send({});
    expect(res.status).toBe(422);
  });
});

// ── Forgot Password ───────────────────────────────────────────────────────────

describe('POST /auth/forgot-password', () => {
  it('200 — always returns success to prevent user enumeration', async () => {
    const res = await request(app)
      .post(`${BASE}/forgot-password`)
      .send({ email: 'nonexistent@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('200 — sends a reset email for an existing verified account', async () => {
    const res = await request(app)
      .post(`${BASE}/forgot-password`)
      .send({ email: 'jane@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── Reset Password ────────────────────────────────────────────────────────────

describe('POST /auth/reset-password', () => {
  let resetToken;

  beforeAll(async () => {
    // Request a fresh reset token for jane
    await request(app)
      .post(`${BASE}/forgot-password`)
      .send({ email: 'jane@example.com' });
    const dbUser = await User.unscoped().findOne({ where: { email: 'jane@example.com' } });
    resetToken = dbUser.resetPasswordToken;
  });

  it('200 — resets the password with a valid token', async () => {
    const res = await request(app).post(`${BASE}/reset-password`).send({
      token: resetToken, newPassword: 'newSecurePass456',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('200 — the user can now log in with the new password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'jane@example.com', password: 'newSecurePass456' });
    expect(res.status).toBe(200);
  });

  it('400 — rejects an invalid reset token', async () => {
    const res = await request(app).post(`${BASE}/reset-password`).send({
      token: 'invalid-reset-token-xyz', newPassword: 'AnotherPass789',
    });
    expect(res.status).toBe(400);
  });

  it('400 — rejects a token that has already been used', async () => {
    // resetToken was consumed by the first test above
    const res = await request(app).post(`${BASE}/reset-password`).send({
      token: resetToken, newPassword: 'YetAnotherPass000',
    });
    expect(res.status).toBe(400);
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('200 — invalidates the session', async () => {
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'jane@example.com', password: 'newSecurePass456' });
    const { accessToken, refreshToken: rt } = loginRes.body.data;

    const logoutRes = await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logoutRes.status).toBe(200);

    // Refresh token should now be revoked
    const refreshRes = await request(app)
      .post(`${BASE}/refresh-token`)
      .send({ refreshToken: rt });
    expect(refreshRes.status).toBe(401);
  });

  it('401 — requires authentication', async () => {
    const res = await request(app).post(`${BASE}/logout`);
    expect(res.status).toBe(401);
  });
});
