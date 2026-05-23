const donationService = require('../services/donation.service');
const { successResponse, errorResponse } = require('../utils/response');

async function createOrder(req, res, next) {
  try {
    const order = await donationService.createRazorpayOrder(req.user.id, req.body);
    res.status(201).json(successResponse(order, 'Order created.'));
  } catch (err) {
    next(err);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const donation = await donationService.verifyRazorpayPayment(req.user.id, req.body);
    res.json(successResponse(donation, 'Payment verified. Thank you for your donation!'));
  } catch (err) {
    next(err);
  }
}

// Webhook — body is raw Buffer (express.raw applied in route)
async function razorpayWebhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    await donationService.handleRazorpayWebhook(req.body, signature);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

async function createStripeIntent(req, res, next) {
  try {
    const intent = await donationService.createStripeIntent(req.user.id, req.body);
    res.status(201).json(successResponse(intent, 'Payment intent created.'));
  } catch (err) {
    next(err);
  }
}

async function confirmStripePayment(req, res, next) {
  try {
    const donation = await donationService.confirmStripePayment(req.user.id, req.body);
    res.json(successResponse(donation, 'Payment confirmed. Thank you for your donation!'));
  } catch (err) {
    next(err);
  }
}

async function getDonation(req, res, next) {
  try {
    const donation = await donationService.getDonation(req.user, req.params.id);
    res.json(successResponse(donation));
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, verifyPayment, razorpayWebhook, createStripeIntent, confirmStripePayment, getDonation };
