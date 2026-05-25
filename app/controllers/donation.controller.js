const donationService = require('../services/donation.service');
const { successResponse } = require('../../utils/response');

class DonationController {
  async createOrder(req, res, next) {
    try {
      const order = await donationService.createRazorpayOrder(req.user.id, req.body);
      res.status(201).json(successResponse(order, 'Order created.'));
    } catch (err) {
      next(err);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const donation = await donationService.verifyRazorpayPayment(req.user.id, req.body);
      res.json(successResponse(donation, 'Payment verified. Thank you for your donation!'));
    } catch (err) {
      next(err);
    }
  }

  // Webhook — body is raw Buffer (express.raw applied in route)
  async razorpayWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      await donationService.handleRazorpayWebhook(req.body, signature);
      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }

  async createStripeIntent(req, res, next) {
    try {
      const intent = await donationService.createStripeIntent(req.user.id, req.body);
      res.status(201).json(successResponse(intent, 'Payment intent created.'));
    } catch (err) {
      next(err);
    }
  }

  async confirmStripePayment(req, res, next) {
    try {
      const donation = await donationService.confirmStripePayment(req.user.id, req.body);
      res.json(successResponse(donation, 'Payment confirmed. Thank you for your donation!'));
    } catch (err) {
      next(err);
    }
  }

  async getDonation(req, res, next) {
    try {
      const donation = await donationService.getDonation(req.user, req.params.id);
      res.json(successResponse(donation));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DonationController();
