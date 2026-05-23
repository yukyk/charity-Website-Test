const request = require('supertest');
const bcrypt  = require('bcryptjs');
const app     = require('../src/app');
const { sequelize, User } = require('../src/models');

jest.mock('../src/services/email.service', () => ({
  sendVerificationEmail:    jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail:   jest.fn().mockResolvedValue(undefined),
  sendDonationConfirmation: jest.fn().mockResolvedValue(undefined),
  sendCharityApproved:      jest.fn().mockResolvedValue(undefined),
  sendCharityRejected:      jest.fn().mockResolvedValue(undefined),
  sendImpactReport:         jest.fn().mockResolvedValue(undefined),
}));

const AUTH      = '/api/v1/auth';
const CHARITIES = '/api/v1/charities';
const ADMIN     = '/api/v1/admin';

let userToken;
let adminToken;
let charityId;

// ── Test-wide setup ───────────────────────────────────────────────────────────

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Donor — registered through the API so the full auth flow is exercised
  await request(app).post(`${AUTH}/register`).send({
    name: 'Donor User', email: 'donor@test.com', password: 'DonorPass123',
  });
  const donor = await User.unscoped().findOne({ where: { email: 'donor@test.com' } });
  await donor.update({ isVerified: true });
  const donorLogin = await request(app)
    .post(`${AUTH}/login`)
    .send({ email: 'donor@test.com', password: 'DonorPass123' });
  userToken = donorLogin.body.data.accessToken;

  // Admin — inserted directly so we don't need a separate register+verify flow
  const hashed = await bcrypt.hash('AdminPass123', 10);
  await User.create({
    name: 'Platform Admin', email: 'admin@test.com', password: hashed,
    role: 'admin', isVerified: true, isActive: true,
  });
  const adminLogin = await request(app)
    .post(`${AUTH}/login`)
    .send({ email: 'admin@test.com', password: 'AdminPass123' });
  adminToken = adminLogin.body.data.accessToken;
});

afterAll(async () => {
  await sequelize.close();
});

// ── List charities (public) ───────────────────────────────────────────────────

describe('GET /charities', () => {
  it('200 — returns an empty list when no charities are approved', async () => {
    const res = await request(app).get(CHARITIES);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('200 — accepts valid filter query params', async () => {
    const res = await request(app)
      .get(CHARITIES)
      .query({ category: 'education', page: 1, limit: 5 });
    expect(res.status).toBe(200);
  });

  it('422 — rejects an invalid category filter', async () => {
    const res = await request(app).get(CHARITIES).query({ category: 'invalid_cat' });
    expect(res.status).toBe(422);
  });
});

// ── Create charity ────────────────────────────────────────────────────────────

describe('POST /charities', () => {
  it('401 — requires authentication', async () => {
    const res = await request(app).post(CHARITIES).send({
      name: 'Anon Charity', email: 'anon@charity.org', category: 'education',
    });
    expect(res.status).toBe(401);
  });

  it('422 — rejects missing required fields', async () => {
    const res = await request(app)
      .post(CHARITIES)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'No Category Charity', email: 'nocat@charity.org' });
    expect(res.status).toBe(422);
  });

  it('201 — creates a charity with status: pending', async () => {
    const res = await request(app)
      .post(CHARITIES)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name:        'Helping Hands Foundation',
        email:       'contact@helpinghands.org',
        category:    'education',
        description: 'We help underprivileged children.',
        location:    'Mumbai, Maharashtra',
        goalAmount:  100000,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    // MySQL serialises DECIMAL as '0.00'; SQLite returns the number 0 — normalise
    expect(parseFloat(res.body.data.raisedAmount)).toBe(0);
    charityId = res.body.data.id;
  });

  it('409 — rejects duplicate charity email', async () => {
    const res = await request(app)
      .post(CHARITIES)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Dup Charity', email: 'contact@helpinghands.org', category: 'health' });
    expect(res.status).toBe(409);
  });
});

// ── Admin: list all charities ─────────────────────────────────────────────────

describe('GET /admin/charities', () => {
  it('401 — requires authentication', async () => {
    const res = await request(app).get(`${ADMIN}/charities`);
    expect(res.status).toBe(401);
  });

  it('403 — rejects non-admin users', async () => {
    const res = await request(app)
      .get(`${ADMIN}/charities`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('200 — admin sees all charities including pending', async () => {
    const res = await request(app)
      .get(`${ADMIN}/charities`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const pending = res.body.data.find((c) => c.id === charityId);
    expect(pending).toBeDefined();
    expect(pending.status).toBe('pending');
  });

  it('200 — admin can filter by status', async () => {
    const res = await request(app)
      .get(`${ADMIN}/charities`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'pending' });
    expect(res.status).toBe(200);
    expect(res.body.data.every((c) => c.status === 'pending')).toBe(true);
  });
});

// ── Admin: approve charity ────────────────────────────────────────────────────

describe('PUT /admin/charities/:id/approve', () => {
  it('422 — rejects invalid UUID', async () => {
    const res = await request(app)
      .put(`${ADMIN}/charities/not-a-uuid/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(422);
  });

  it('200 — admin approves the charity', async () => {
    const res = await request(app)
      .put(`${ADMIN}/charities/${charityId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });

  it('GET /charities — approved charity now appears in public list', async () => {
    const res = await request(app).get(CHARITIES);
    expect(res.status).toBe(200);
    const found = res.body.data.find((c) => c.id === charityId);
    expect(found).toBeDefined();
    expect(found.status).toBe('approved');
  });
});

// ── Admin: reject charity ─────────────────────────────────────────────────────

describe('PUT /admin/charities/:id/reject', () => {
  let rejectId;

  beforeAll(async () => {
    const res = await request(app)
      .post(CHARITIES)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Charity To Reject', email: 'reject@charity.org', category: 'health' });
    rejectId = res.body.data.id;
  });

  it('422 — requires adminNote', async () => {
    const res = await request(app)
      .put(`${ADMIN}/charities/${rejectId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it('200 — admin rejects the charity with a reason', async () => {
    const res = await request(app)
      .put(`${ADMIN}/charities/${rejectId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminNote: 'Could not verify registration number.' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
    expect(res.body.data.adminNote).toBe('Could not verify registration number.');
  });

  it('GET /charities — rejected charity does not appear in public list', async () => {
    const res = await request(app).get(CHARITIES);
    const found = res.body.data.find((c) => c.id === rejectId);
    expect(found).toBeUndefined();
  });
});

// ── Owner: update charity ─────────────────────────────────────────────────────

describe('PUT /charities/:id (owner update)', () => {
  it('200 — owner can update charity fields', async () => {
    const res = await request(app)
      .put(`${CHARITIES}/${charityId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ description: 'Updated description.', location: 'Pune, Maharashtra' });
    expect(res.status).toBe(200);
    expect(res.body.data.location).toBe('Pune, Maharashtra');
  });

  it('401 — requires authentication', async () => {
    const res = await request(app)
      .put(`${CHARITIES}/${charityId}`)
      .send({ description: 'Nope' });
    expect(res.status).toBe(401);
  });

  it("403 — non-owner cannot update another user's charity", async () => {
    // Create a second user
    await request(app).post(`${AUTH}/register`).send({
      name: 'Other User', email: 'other@test.com', password: 'OtherPass123',
    });
    const other = await User.unscoped().findOne({ where: { email: 'other@test.com' } });
    await other.update({ isVerified: true });
    const otherLogin = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: 'other@test.com', password: 'OtherPass123' });
    const otherToken = otherLogin.body.data.accessToken;

    const res = await request(app)
      .put(`${CHARITIES}/${charityId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ description: 'Hijack attempt' });
    expect(res.status).toBe(403);
  });
});
