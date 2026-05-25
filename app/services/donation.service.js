/**
 * donation.service.js — orchestrates all donation state transitions.
 *
 * Razorpay flow:
 *   createRazorpayOrder → (user pays on frontend) → verifyRazorpayPayment
 *   handleRazorpayWebhook handles server-side failure events
 *
 * Stripe flow:
 *   createStripeIntent → (user confirms on frontend with Stripe.js) → confirmStripePayment
 *
 * Monetary arithmetic always uses parseFloat() — Error #12.
 * Charity + project raisedAmount increments run inside a single DB transaction.
 */

const { sequelize, Donation, Charity, Project, User } = require('../models');
const paymentService      = require('./payment.service');
const notificationService = require('./notification.service');
const emailService        = require('./email.service');
const { stripHtml }       = require('../../utils/helpers');

// ── Internal helpers ──────────────────────────────────────────────────────────

async function resolveCharityAndProject(charityId, projectId) {
  const charity = await Charity.findOne({ where: { id: charityId, status: 'approved' } });
  if (!charity) {
    const err = new Error('Charity not found or not yet approved');
    err.statusCode = 404;
    throw err;
  }

  let project = null;
  if (projectId) {
    project = await Project.findOne({ where: { id: projectId, charityId, status: 'active' } });
    if (!project) {
      const err = new Error('Project not found, not active, or does not belong to this charity');
      err.statusCode = 404;
      throw err;
    }
  }

  return { charity, project };
}

async function completeDonation(donation, paymentId) {
  const amount = parseFloat(donation.amount); // Error #12

  await sequelize.transaction(async (t) => {
    await donation.update({ status: 'completed', paymentId }, { transaction: t });

    await Charity.increment('raisedAmount', {
      by:          amount,
      where:       { id: donation.charityId },
      transaction: t,
    });

    if (donation.projectId) {
      await Project.increment('raisedAmount', {
        by:          amount,
        where:       { id: donation.projectId },
        transaction: t,
      });
    }
  });
}

async function dispatchPostDonationSideEffects(donation) {
  try {
    const formattedAmount = parseFloat(donation.amount).toLocaleString('en-IN', {
      style:    'currency',
      currency: donation.currency || 'INR',
    });
    const charityName = donation.charity?.name || 'the charity';

    await notificationService.create(
      donation.userId,
      'donation_confirmed',
      `Your donation of ${formattedAmount} to ${charityName} was received. Thank you!`
    );

    const [user, charity] = await Promise.all([
      User.findByPk(donation.userId),
      Charity.findByPk(donation.charityId, { attributes: ['id', 'name', 'email', 'logoUrl'] }),
    ]);

    if (user && charity) {
      emailService.sendDonationConfirmation(user, donation, charity).catch((err) => {
        console.error('[email] sendDonationConfirmation failed:', err.message);
      });
    }
  } catch (err) {
    console.error('[donation] post-donation side effects failed:', err.message);
  }
}

// ── Razorpay ──────────────────────────────────────────────────────────────────

async function createRazorpayOrder(userId, data) {
  const { charityId, projectId, amount, message, isAnonymous } = data;
  const parsedAmount = parseFloat(amount);

  if (parsedAmount < 10) {
    const err = new Error('Minimum donation amount is ₹10');
    err.statusCode = 400;
    throw err;
  }

  const { charity, project } = await resolveCharityAndProject(charityId, projectId || null);

  // Create DB record first so we can use its UUID as the Razorpay receipt
  const donation = await Donation.create({
    amount:         parsedAmount,
    currency:       'INR',
    status:         'pending',
    paymentGateway: 'razorpay',
    message:        message ? stripHtml(message) : null,
    isAnonymous:    Boolean(isAnonymous),
    userId,
    charityId:      charity.id,
    projectId:      project ? project.id : null,
  });

  let razorpayOrder;
  try {
    razorpayOrder = await paymentService.createRazorpayOrder({
      amountINR: parsedAmount,
      receipt:   donation.id, // UUID fits Razorpay's 40-char limit
    });
  } catch (err) {
    // Clean up the pending record if the gateway call fails
    await donation.destroy();
    // Razorpay SDK throws non-standard error objects — extract description from multiple possible shapes
    const msg =
      err?.error?.description ||
      err?.response?.data?.error?.description ||
      err?.message ||
      (typeof err === 'string' ? err : JSON.stringify(err));
    console.error('[razorpay] createOrder failed:', msg, err);
    const error = new Error(`Payment gateway error: ${msg}`);
    error.statusCode = 502;
    throw error;
  }

  // Persist the Razorpay orderId so we can match it on verify + webhook
  await donation.update({ paymentOrderId: razorpayOrder.id });

  return {
    donationId:  donation.id,
    orderId:     razorpayOrder.id,   // passed to Razorpay checkout on frontend
    amount:      razorpayOrder.amount, // paise
    currency:    razorpayOrder.currency,
    keyId:       process.env.RAZORPAY_KEY_ID, // Error #9 — key must reach frontend
    charityName: charity.name,
    description: `Donation to ${charity.name}`,
  };
}

async function verifyRazorpayPayment(userId, data) {
  const {
    donationId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = data;

  // Find only pending donations belonging to this user — prevents other users from
  // verifying someone else's donation
  const donation = await Donation.findOne({
    where: { id: donationId, userId, status: 'pending', paymentGateway: 'razorpay' },
  });

  if (!donation) {
    const err = new Error('Donation not found or already processed');
    err.statusCode = 404;
    throw err;
  }

  // Error #4 — signature = HMAC-SHA256(`${orderId}|${paymentId}`, key_secret)
  const isValid = paymentService.verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    await donation.update({ status: 'failed' });
    const err = new Error('Payment signature verification failed. Your payment was not recorded.');
    err.statusCode = 400;
    throw err;
  }

  await completeDonation(donation, razorpay_payment_id);

  // Reload with associations for the response
  const completed = await Donation.findByPk(donationId, {
    include: [
      { model: Charity, as: 'charity', attributes: ['id', 'name', 'logoUrl', 'category'] },
      { model: Project, as: 'project', attributes: ['id', 'title'], required: false },
    ],
  });

  // Side effects are non-blocking
  dispatchPostDonationSideEffects(completed);

  return completed;
}

// rawBody MUST be the original Buffer — express.raw() is applied in the route. (Error #15)
async function handleRazorpayWebhook(rawBody, signature) {
  if (!signature) {
    const err = new Error('Missing webhook signature');
    err.statusCode = 400;
    throw err;
  }

  const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    const err = new Error('Invalid webhook signature');
    err.statusCode = 400;
    throw err;
  }

  const event = JSON.parse(rawBody.toString('utf8'));

  if (event.event === 'payment.failed') {
    const orderId = event.payload?.payment?.entity?.order_id;
    if (orderId) {
      await Donation.update(
        { status: 'failed' },
        { where: { paymentOrderId: orderId, status: 'pending' } }
      );
    }
  }
  // Future events (payment.captured, refund.created, etc.) can be handled here
}

// ── Stripe ─────────────────────────────────────────────────────────────────────

async function createStripeIntent(userId, data) {
  const { charityId, projectId, amount, currency = 'usd', message, isAnonymous } = data;
  const parsedAmount = parseFloat(amount);

  const { charity, project } = await resolveCharityAndProject(charityId, projectId || null);

  const donation = await Donation.create({
    amount:         parsedAmount,
    currency:       currency.toUpperCase(),
    status:         'pending',
    paymentGateway: 'stripe',
    message:        message ? stripHtml(message) : null,
    isAnonymous:    Boolean(isAnonymous),
    userId,
    charityId:      charity.id,
    projectId:      project ? project.id : null,
  });

  let intent;
  try {
    intent = await paymentService.createStripePaymentIntent({
      amount,
      currency,
      metadata: { donationId: donation.id, charityId, userId },
    });
  } catch (err) {
    await donation.destroy();
    const error = new Error(`Payment gateway error: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  // Store the PaymentIntent ID so we can retrieve it on confirm
  await donation.update({ paymentOrderId: intent.id });

  return {
    donationId:   donation.id,
    clientSecret: intent.client_secret, // passed to Stripe.js on frontend
    currency:     intent.currency,
    charityName:  charity.name,
  };
}

async function confirmStripePayment(userId, data) {
  const { donationId, paymentIntentId } = data;

  const donation = await Donation.findOne({
    where: { id: donationId, userId, status: 'pending', paymentGateway: 'stripe' },
  });

  if (!donation) {
    const err = new Error('Donation not found or already processed');
    err.statusCode = 404;
    throw err;
  }

  let intent;
  try {
    intent = await paymentService.retrieveStripePaymentIntent(paymentIntentId);
  } catch (err) {
    const error = new Error('Could not verify payment status with Stripe');
    error.statusCode = 502;
    throw error;
  }

  if (intent.status !== 'succeeded') {
    if (intent.status === 'canceled' || intent.status === 'payment_failed') {
      await donation.update({ status: 'failed' });
    }
    const err = new Error(`Payment not completed. Stripe status: ${intent.status}`);
    err.statusCode = 400;
    throw err;
  }

  await completeDonation(donation, intent.id);

  const completed = await Donation.findByPk(donationId, {
    include: [
      { model: Charity, as: 'charity', attributes: ['id', 'name', 'logoUrl', 'category'] },
      { model: Project, as: 'project', attributes: ['id', 'title'], required: false },
    ],
  });

  dispatchPostDonationSideEffects(completed);

  return completed;
}

// ── Retrieval ──────────────────────────────────────────────────────────────────

async function getDonation(user, donationId) {
  const where = { id: donationId };
  // Admins see any donation; regular users only see their own
  if (user.role !== 'admin') where.userId = user.id;

  const donation = await Donation.findOne({
    where,
    include: [
      {
        model: Charity,
        as:    'charity',
        attributes: ['id', 'name', 'logoUrl', 'category', 'location'],
      },
      {
        model:    Project,
        as:       'project',
        attributes: ['id', 'title'],
        required: false,
      },
      {
        model:      User,
        as:         'donor',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  if (!donation) {
    const err = new Error('Donation not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  // Mask donor identity for anonymous donations (admins always see the real identity)
  if (donation.isAnonymous && user.role !== 'admin') {
    const d = donation.toJSON();
    d.donor = { name: 'Anonymous Donor' };
    return d;
  }

  return donation;
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  createStripeIntent,
  confirmStripePayment,
  getDonation,
};
