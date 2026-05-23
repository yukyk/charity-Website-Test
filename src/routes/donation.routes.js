const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const donationController = require('../controllers/donation.controller');

/**
 * @swagger
 * /donations/create-order:
 *   post:
 *     summary: Create a Razorpay order (step 1 of Razorpay flow)
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Creates a Razorpay order and a `pending` donation record.
 *       Pass the returned `orderId`, `amount`, `currency`, and `keyId` to the
 *       Razorpay checkout SDK on the frontend. After the user completes payment,
 *       call `POST /donations/verify-payment` with the returned Razorpay fields.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [charityId, amount]
 *             properties:
 *               charityId:
 *                 type: string
 *                 format: uuid
 *                 example: c1d2e3f4-a5b6-7890-cdef-012345678901
 *               amount:
 *                 type: number
 *                 minimum: 10
 *                 description: Amount in INR (minimum ₹10).
 *                 example: 500
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional — donate to a specific project within the charity.
 *                 example: p1q2r3s4-t5u6-7890-vwxy-z01234567890
 *               message:
 *                 type: string
 *                 example: Keep up the great work!
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Razorpay order created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         donationId:  { type: string, format: uuid }
 *                         orderId:     { type: string, example: order_XXXXXXXXXXXXXXXX }
 *                         amount:      { type: integer, description: "Amount in paise (INR × 100)", example: 50000 }
 *                         currency:    { type: string, example: INR }
 *                         keyId:       { type: string, example: rzp_test_XXXXXXXX, description: "Pass to Razorpay checkout SDK" }
 *                         charityName: { type: string, example: Helping Hands Foundation }
 *                         description: { type: string, example: "Donation to Helping Hands Foundation" }
 *       400:
 *         description: Amount below minimum or charity not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       502:
 *         description: Razorpay gateway error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/create-order',
  verifyToken,
  [
    body('charityId').isUUID(4).withMessage('Invalid charity ID'),
    body('amount').isFloat({ min: 10 }).withMessage('Minimum donation amount is ₹10'),
    body('projectId').optional().isUUID(4),
    body('message').optional().trim(),
    body('isAnonymous').optional().isBoolean(),
  ],
  validate,
  donationController.createOrder
);

/**
 * @swagger
 * /donations/verify-payment:
 *   post:
 *     summary: Verify a Razorpay payment and complete the donation (step 2)
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Verifies the HMAC-SHA256 signature returned by the Razorpay checkout SDK.
 *       On success, the donation is marked `completed`, the charity's `raisedAmount`
 *       is incremented atomically, and a confirmation email + notification are sent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [donationId, razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               donationId:
 *                 type: string
 *                 format: uuid
 *                 description: The `donationId` returned by `POST /donations/create-order`.
 *               razorpay_order_id:
 *                 type: string
 *                 example: order_XXXXXXXXXXXXXXXX
 *               razorpay_payment_id:
 *                 type: string
 *                 example: pay_XXXXXXXXXXXXXXXX
 *               razorpay_signature:
 *                 type: string
 *                 example: 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b
 *     responses:
 *       200:
 *         description: Payment verified — donation completed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donation'
 *       400:
 *         description: Signature verification failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/verify-payment',
  verifyToken,
  [
    body('donationId').isUUID(4).withMessage('Invalid donation ID'),
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
  ],
  validate,
  donationController.verifyPayment
);

/**
 * @swagger
 * /donations/webhook:
 *   post:
 *     summary: Razorpay server-to-server webhook
 *     tags: [Donations]
 *     description: >
 *       **Do not call this endpoint directly.** It is invoked by Razorpay's servers.
 *       Requires the `x-razorpay-signature` header for HMAC-SHA256 verification.
 *       Handles `payment.failed` events to mark pending donations as failed.
 *       The body must be the **raw JSON bytes** — do not use a JSON-parsing proxy.
 *     parameters:
 *       - in: header
 *         name: x-razorpay-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC-SHA256 signature of the raw request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Razorpay event payload.
 *     responses:
 *       200:
 *         description: Webhook received.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received: { type: boolean, example: true }
 *       400:
 *         description: Missing or invalid signature.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// express.raw() is applied here and NOT app-level express.json() — Error #15
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  donationController.razorpayWebhook
);

/**
 * @swagger
 * /donations/stripe/create-intent:
 *   post:
 *     summary: Create a Stripe PaymentIntent (step 1 of Stripe flow)
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Creates a Stripe PaymentIntent and a `pending` donation record.
 *       Pass the returned `clientSecret` to `Stripe.js` on the frontend to complete payment.
 *       After the user confirms, call `POST /donations/stripe/confirm`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [charityId, amount]
 *             properties:
 *               charityId:
 *                 type: string
 *                 format: uuid
 *                 example: c1d2e3f4-a5b6-7890-cdef-012345678901
 *               amount:
 *                 type: number
 *                 example: 10.00
 *               currency:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 3
 *                 default: usd
 *                 example: usd
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               message:
 *                 type: string
 *                 example: Happy to support!
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: PaymentIntent created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         donationId:   { type: string, format: uuid }
 *                         clientSecret: { type: string, description: "Pass to Stripe.js — never expose server-side." }
 *                         currency:     { type: string, example: usd }
 *                         charityName:  { type: string, example: Helping Hands Foundation }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       502:
 *         description: Stripe gateway error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/stripe/create-intent',
  verifyToken,
  [
    body('charityId').isUUID(4).withMessage('Invalid charity ID'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('projectId').optional().isUUID(4),
    body('message').optional().trim(),
    body('isAnonymous').optional().isBoolean(),
  ],
  validate,
  donationController.createStripeIntent
);

/**
 * @swagger
 * /donations/stripe/confirm:
 *   post:
 *     summary: Confirm a Stripe payment and complete the donation (step 2)
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Retrieves the PaymentIntent from Stripe and verifies its `status === succeeded`.
 *       On success, donation is marked `completed` and `raisedAmount` is incremented atomically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [donationId, paymentIntentId]
 *             properties:
 *               donationId:
 *                 type: string
 *                 format: uuid
 *                 description: The `donationId` returned by `POST /donations/stripe/create-intent`.
 *               paymentIntentId:
 *                 type: string
 *                 example: pi_XXXXXXXXXXXXXXXXXXXXXXXX
 *     responses:
 *       200:
 *         description: Payment confirmed — donation completed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donation'
 *       400:
 *         description: Payment not yet succeeded or was cancelled.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       502:
 *         description: Could not verify with Stripe.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/stripe/confirm',
  verifyToken,
  [
    body('donationId').isUUID(4).withMessage('Invalid donation ID'),
    body('paymentIntentId').notEmpty(),
  ],
  validate,
  donationController.confirmStripePayment
);

/**
 * @swagger
 * /donations/{id}:
 *   get:
 *     summary: Get a single donation
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Regular users can only fetch their own donations. Admins can fetch any donation.
 *       Anonymous donations return `donor: { name: "Anonymous Donor" }` for non-admins.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: d1e2f3a4-b5c6-7890-defa-012345678901
 *     responses:
 *       200:
 *         description: Donation details including charity and project.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  '/:id',
  verifyToken,
  [param('id').isUUID(4).withMessage('Invalid donation ID')],
  validate,
  donationController.getDonation
);

module.exports = router;
