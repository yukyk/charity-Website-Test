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
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

function getStripe() {
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
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ── Razorpay API ───────────────────────────────────────────────────────────────

/**
 * Creates a Razorpay order.
 * @param {number}  amountINR  Rupee amount (e.g. 500 → 50000 paise)
 * @param {string}  receipt    Unique receipt string (use our donation UUID)
 * @returns Razorpay order object: { id, amount, currency, receipt, ... }
 */
async function createRazorpayOrder({ amountINR, receipt }) {
  return getRazorpay().orders.create({
    amount:   Math.round(parseFloat(amountINR) * 100), // Error #12 — parseFloat before arithmetic
    currency: 'INR',
    receipt,  // max 40 chars; donation UUID fits
  });
}

// ── Stripe API ─────────────────────────────────────────────────────────────────

/**
 * Creates a Stripe PaymentIntent.
 * @param {number} amount    Amount in the specified currency (e.g. 10.00 USD)
 * @param {string} currency  ISO 4217 code, default 'usd'
 * @param {object} metadata  Key-value pairs stored on the PI (donationId, etc.)
 * @returns Stripe PaymentIntent: { id, client_secret, status, ... }
 */
async function createStripePaymentIntent({ amount, currency = 'usd', metadata = {} }) {
  return getStripe().paymentIntents.create({
    amount:   Math.round(parseFloat(amount) * 100),
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

/**
 * Retrieves a Stripe PaymentIntent by ID (used during confirmation to check status).
 */
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
