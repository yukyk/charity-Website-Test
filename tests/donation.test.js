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

// Mock Razorpay and Stripe — we test our logic, not the payment gateways
jest.mock('../src/services/payment.service', () => ({
  createRazorpayOrder: jest.fn().mockResolvedValue({
    id:       'order_test123456789',
    amount:   50000, // paise (₹500)
    currency: 'INR',
  }),
  verifyRazorpaySignature: jest.fn().mockReturnValue(true),
  verifyWebhookSignature:  jest.fn().mockReturnValue(true),
  createStripePaymentIntent: jest.fn().mockResolvedValue({
    id:            'pi_test123456789',
    client_secret: 'pi_test_secret_xxxxxxxxxxxx',
    currency:      'usd',
    status:        'requires_payment_method',
  }),
  retrieveStripePaymentIntent: jest.fn().mockResolvedValue({
    id:     'pi_test123456789',
    status: 'succeeded',
  }),
}));

const AUTH      = '/api/v1/auth';
const DONATIONS = '/api/v1/donations';
const ADMIN     = '/api/v1/admin';
const CHARITIES = '/api/v1/charities';

let userToken;
let charityId;
let donationId;
let razorpayOrderId;

// ── Test-wide setup ───────────────────────────────────────────────────────────

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Donor user
  await request(app).post(`${AUTH}/register`).send({
    name: 'Test Donor', email: 'donor@test.com', password: 'DonorPass123',
  });
  const donor = await User.unscoped().findOne({ where: { email: 'donor@test.com' } });
  await donor.update({ isVerified: true });
  const donorLogin = await request(app)
    .post(`${AUTH}/login`)
    .send({ email: 'donor@test.com', password: 'DonorPass123' });
  userToken = donorLogin.body.data.accessToken;

  // Admin user
  const hashed = await bcrypt.hash('AdminPass123', 10);
  await User.create({
    name: 'Admin', email: 'admin@test.com', password: hashed,
    role: 'admin', isVerified: true, isActive: true,
  });
  const adminLogin = await request(app)
    .post(`${AUTH}/login`)
    .send({ email: 'admin@test.com', password: 'AdminPass123' });
  const adminToken = adminLogin.body.data.accessToken;

  // Create + approve a charity so donations can be made
  const charityRes = await request(app)
    .post(CHARITIES)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Test Charity', email: 'charity@test.org', category: 'education' });
  charityId = charityRes.body.data.id;

  await request(app)
    .put(`${ADMIN}/charities/${charityId}/approve`)
    .set('Authorization', `Bearer ${adminToken}`);
});

afterAll(async () => {
  await sequelize.close();
});

// ── Create Razorpay order ─────────────────────────────────────────────────────

describe('POST /donations/create-order', () => {
  it('401 — requires authentication', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/create-order`)
      .send({ charityId, amount: 500 });
    expect(res.status).toBe(401);
  });

  it('422 — rejects amount below minimum (₹10)', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/create-order`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ charityId, amount: 5 });
    expect(res.status).toBe(422);
  });

  it('422 — rejects invalid charityId format', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/create-order`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ charityId: 'not-a-uuid', amount: 500 });
    expect(res.status).toBe(422);
  });

  it('404 — rejects a non-existent charity', async () => {
    const fakeId = '00000000-0000-4000-a000-000000000001';
    const res = await request(app)
      .post(`${DONATIONS}/create-order`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ charityId: fakeId, amount: 500 });
    expect(res.status).toBe(404);
  });

  it('201 — creates a pending donation and returns Razorpay order details', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/create-order`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ charityId, amount: 500, message: 'Keep up the great work!', isAnonymous: false });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      orderId:     'order_test123456789',
      amount:      50000,
      currency:    'INR',
      charityName: 'Test Charity',
    });
    expect(res.body.data).toHaveProperty('donationId');
    expect(res.body.data).toHaveProperty('keyId');
    donationId     = res.body.data.donationId;
    razorpayOrderId = res.body.data.orderId;
  });
});

// ── Verify Razorpay payment ───────────────────────────────────────────────────

describe('POST /donations/verify-payment', () => {
  it('200 — completes the donation when signature is valid (mocked)', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/verify-payment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        donationId,
        razorpay_order_id:   razorpayOrderId,
        razorpay_payment_id: 'pay_test123456789',
        razorpay_signature:  'mock_valid_signature',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.id).toBe(donationId);
  });

  it('404 — rejects re-verification of an already-completed donation', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/verify-payment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        donationId,
        razorpay_order_id:   razorpayOrderId,
        razorpay_payment_id: 'pay_test123456789',
        razorpay_signature:  'mock_valid_signature',
      });
    // Donation is no longer pending — expect 404 (not found for userId+status=pending)
    expect(res.status).toBe(404);
  });

  it('400 — fails when signature check returns false', async () => {
    // Override mock to return false just for this test
    const paymentService = require('../src/services/payment.service');
    paymentService.verifyRazorpaySignature.mockReturnValueOnce(false);

    // Create a fresh order to get a pending donation
    const orderRes = await request(app)
      .post(`${DONATIONS}/create-order`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ charityId, amount: 200 });
    const newDonationId = orderRes.body.data.donationId;

    const res = await request(app)
      .post(`${DONATIONS}/verify-payment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        donationId:          newDonationId,
        razorpay_order_id:   'order_test123456789',
        razorpay_payment_id: 'pay_test_fail',
        razorpay_signature:  'bad_signature',
      });
    expect(res.status).toBe(400);
  });
});

// ── Get single donation ───────────────────────────────────────────────────────

describe('GET /donations/:id', () => {
  it('200 — owner can fetch their own donation', async () => {
    const res = await request(app)
      .get(`${DONATIONS}/${donationId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(donationId);
    expect(res.body.data.status).toBe('completed');
  });

  it('401 — requires authentication', async () => {
    const res = await request(app).get(`${DONATIONS}/${donationId}`);
    expect(res.status).toBe(401);
  });

  it('404 — user cannot fetch another user\'s donation', async () => {
    // Register + verify a second user
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
      .get(`${DONATIONS}/${donationId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});

// ── Stripe flow ───────────────────────────────────────────────────────────────

describe('POST /donations/stripe/create-intent', () => {
  it('401 — requires authentication', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/stripe/create-intent`)
      .send({ charityId, amount: 10.00, currency: 'usd' });
    expect(res.status).toBe(401);
  });

  it('201 — creates a Stripe PaymentIntent and returns clientSecret', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/stripe/create-intent`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ charityId, amount: 10.00, currency: 'usd', message: 'Happy to help!' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('clientSecret');
    expect(res.body.data).toHaveProperty('donationId');
    expect(res.body.data.currency).toBe('usd');
  });
});

// ── Razorpay webhook ──────────────────────────────────────────────────────────

describe('POST /donations/webhook', () => {
  it('400 — rejects request without x-razorpay-signature header', async () => {
    const res = await request(app)
      .post(`${DONATIONS}/webhook`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ event: 'payment.failed' }));
    expect(res.status).toBe(400);
  });

  it('200 — accepts valid webhook with mocked signature', async () => {
    const payload = JSON.stringify({ event: 'payment.failed', payload: { payment: { entity: { order_id: 'order_unknown' } } } });
    const res = await request(app)
      .post(`${DONATIONS}/webhook`)
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'mock_webhook_sig')
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
