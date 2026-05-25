const crypto = require('crypto');

// Mock Razorpay and Stripe before requiring the service
jest.mock('razorpay', () =>
  jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id:       'order_test_123456789',
        amount:   50000,
        currency: 'INR',
        receipt:  'receipt_test_123',
        status:   'created',
      }),
    },
  }))
);

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id:            'pi_test_123456789',
        client_secret: 'pi_test_123_secret_456',
        amount:        50000,
        currency:      'inr',
        status:        'requires_payment_method',
      }),
    },
  }))
);

// Set required env vars before loading the service
process.env.RAZORPAY_KEY_ID     = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
process.env.STRIPE_SECRET_KEY   = 'sk_test_stripe_secret';

const paymentService = require('../../app/services/payment.service');

describe('PaymentService — createRazorpayOrder', () => {
  it('returns an order with id, amount, and currency', async () => {
    const order = await paymentService.createRazorpayOrder({
      amountINR: 500,
      receipt:   'receipt_test_123',
    });
    expect(order.id).toBe('order_test_123456789');
    expect(order.amount).toBe(50000);
    expect(order.currency).toBe('INR');
    expect(order.status).toBe('created');
  });
});

describe('PaymentService — verifyRazorpaySignature', () => {
  const orderId   = 'order_test_123';
  const paymentId = 'pay_test_456';
  const secret    = process.env.RAZORPAY_KEY_SECRET;

  const validSig = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  it('returns true for a valid HMAC signature', () => {
    const result = paymentService.verifyRazorpaySignature(orderId, paymentId, validSig);
    expect(result).toBe(true);
  });

  it('returns false for a tampered signature', () => {
    // Must be 64 hex chars (SHA-256 output length) for timingSafeEqual to work
    const tampered = 'a'.repeat(64);
    const result = paymentService.verifyRazorpaySignature(orderId, paymentId, tampered);
    expect(result).toBe(false);
  });

  it('returns false when orderId and paymentId are swapped', () => {
    const swappedSig = crypto
      .createHmac('sha256', secret)
      .update(`${paymentId}|${orderId}`)
      .digest('hex');
    // swapped order produces a different payload — must not verify as valid
    expect(paymentService.verifyRazorpaySignature(orderId, paymentId, swappedSig)).toBe(false);
  });
});

describe('PaymentService — createStripePaymentIntent', () => {
  it('returns a clientSecret and payment intent id', async () => {
    const intent = await paymentService.createStripePaymentIntent({
      amount:   500,
      currency: 'usd',
    });
    expect(intent.id).toBe('pi_test_123456789');
    expect(intent.client_secret).toBe('pi_test_123_secret_456');
    expect(intent.status).toBe('requires_payment_method');
  });
});
