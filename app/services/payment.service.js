// PAYMENT MODE: TEST ONLY — no real transactions processed
// Razorpay: rzp_test_ key prefix automatically enables test mode
// Stripe:   sk_test_ key prefix automatically enables test mode
// Test cards — Razorpay: 4111 1111 1111 1111 (OTP: 1234) | UPI: success@razorpay
// Test cards — Stripe:   4242 4242 4242 4242

/**
 * payment.service.js — pure payment-gateway wrappers
 *
 * Responsibilities:
 *  - HMAC signature verification (Razorpay payment + webhook)
 *  - Creating Razorpay orders and Stripe PaymentIntents
 *  - Retrieving Stripe PaymentIntents for confirmation
 *
 * Lazy initialization: Razorpay and Stripe SDK instances are created on first
 * use so that missing env vars don't crash the process at import time (tests).
 *
 * donation.service.js is the sole caller — no controller should talk to this
 * module directly.
 */

const crypto  = require('crypto');
const Razorpay = require('razorpay');
const Stripe   = require('stripe');

let _razorpay;
let _stripe;

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured on this server. Please contact support.');
  }
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured on this server. Please contact support.');
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// ── Signature verification ─────────────────────────────────────────────────────

/**
 * Verifies the Razorpay checkout signature returned to the frontend.
 * Error #4 — payload order is orderId|paymentId (orderId first).
 */
function verifyRazorpaySignature(orderId, paymentId, signature) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const payload  = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Verifies a Razorpay server-to-server webhook signature.
 * Error #15 — rawBody must be the original Buffer, never a re-serialised object.
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ── Razorpay API ───────────────────────────────────────────────────────────────

async function createRazorpayOrder({ amountINR, receipt }) {
  return getRazorpay().orders.create({
    amount:   Math.round(parseFloat(amountINR) * 100), // Error #12 — parseFloat before arithmetic
    currency: 'INR',
    receipt,  // max 40 chars; donation UUID fits
  });
}

// ── Stripe API ─────────────────────────────────────────────────────────────────

async function createStripePaymentIntent({ amount, currency = 'usd', metadata = {} }) {
  return getStripe().paymentIntents.create({
    amount:   Math.round(parseFloat(amount) * 100),
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

async function retrieveStripePaymentIntent(paymentIntentId) {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

module.exports = {
  verifyRazorpaySignature,
  verifyWebhookSignature,
  createRazorpayOrder,
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
};
