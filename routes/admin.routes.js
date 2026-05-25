const router = require('express').Router();
const validate = require('../app/middleware/validate');
const { verifyToken } = require('../app/middleware/auth');
const { requireRole } = require('../app/middleware/roles');
const adminController = require('../app/controllers/admin.controller');
const {
  listCharitiesRules,
  approveCharityRules,
  rejectCharityRules,
  listUsersRules,
  deactivateUserRules,
  listDonationsRules,
} = require('../app/validators/admin.validator');

// All admin routes require authentication + admin role
router.use(verifyToken, requireRole('admin'));

/**
 * @swagger
 * /admin/charities:
 *   get:
 *     summary: List all charities (any status)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Returns all charities including pending and rejected ones. Filterable by status.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by approval status. Omit to return all.
 *         example: pending
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of charities.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Charity'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/charities', listCharitiesRules, validate, adminController.listCharities);

/**
 * @swagger
 * /admin/charities/{id}/approve:
 *   put:
 *     summary: Approve a pending charity
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Sets charity `status` to `approved`. The charity owner receives an in-app
 *       notification and an approval email.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: c1d2e3f4-a5b6-7890-cdef-012345678901
 *     responses:
 *       200:
 *         description: Charity approved.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Charity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/charities/:id/approve', approveCharityRules, validate, adminController.approveCharity);

/**
 * @swagger
 * /admin/charities/{id}/reject:
 *   put:
 *     summary: Reject a charity application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Sets charity `status` to `rejected` and stores the `adminNote` as the rejection reason.
 *       The charity owner receives an in-app notification and a rejection email with the reason.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [adminNote]
 *             properties:
 *               adminNote:
 *                 type: string
 *                 description: Reason for rejection — sent to the charity owner.
 *                 example: "Registration number could not be verified. Please resubmit with a valid NGO certificate."
 *     responses:
 *       200:
 *         description: Charity rejected.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Charity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/charities/:id/reject', rejectCharityRules, validate, adminController.rejectCharity);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all platform users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Partial match on name or email.
 *         example: jane
 *     responses:
 *       200:
 *         description: Paginated user list.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', listUsersRules, validate, adminController.listUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Deactivate a user account (soft delete)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Sets `isActive: false` on the user and clears their `refreshTokenHash`,
 *       immediately invalidating all active sessions. Admin accounts cannot be deactivated.
 *       Donations and charity records are preserved.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *     responses:
 *       200:
 *         description: User deactivated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot deactivate an admin account.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.delete('/users/:id', deactivateUserRules, validate, adminController.deactivateUser);

router.get('/donations', listDonationsRules, validate, adminController.listDonations);

module.exports = router;
