const { body, param } = require('express-validator');

const createOrderRules = [
  body('charityId').isUUID(4).withMessage('Invalid charity ID'),
  body('amount').isFloat({ min: 10 }).withMessage('Minimum donation amount is ₹10'),
  body('projectId').optional().isUUID(4),
  body('message').optional().trim(),
  body('isAnonymous').optional().isBoolean(),
];

const verifyPaymentRules = [
  body('donationId').isUUID(4).withMessage('Invalid donation ID'),
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
];

const createStripeIntentRules = [
  body('charityId').isUUID(4).withMessage('Invalid charity ID'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('projectId').optional().isUUID(4),
  body('message').optional().trim(),
  body('isAnonymous').optional().isBoolean(),
];

const confirmStripePaymentRules = [
  body('donationId').isUUID(4).withMessage('Invalid donation ID'),
  body('paymentIntentId').notEmpty(),
];

const getDonationRules = [
  param('id').isUUID(4).withMessage('Invalid donation ID'),
];

module.exports = {
  createOrderRules,
  verifyPaymentRules,
  createStripeIntentRules,
  confirmStripePaymentRules,
  getDonationRules,
};
