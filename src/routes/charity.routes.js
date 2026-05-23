const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const charityController = require('../controllers/charity.controller');

const CATEGORIES = ['education', 'health', 'environment', 'poverty', 'disaster', 'animals', 'other'];

/**
 * @swagger
 * /charities:
 *   get:
 *     summary: List approved charities
 *     tags: [Charities]
 *     description: Public endpoint. Returns approved charities ordered by `raisedAmount` descending.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [education, health, environment, poverty, disaster, animals, other]
 *         example: education
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *         description: Partial match on the `location` field.
 *         example: Mumbai
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Searches charity `name` and `description`.
 *         example: children
 *     responses:
 *       200:
 *         description: Paginated list of approved charities.
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
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isIn(CATEGORIES),
    query('location').optional().trim(),
    query('search').optional().trim(),
  ],
  validate,
  charityController.listCharities
);

/**
 * @swagger
 * /charities/{id}:
 *   get:
 *     summary: Get a single approved charity
 *     tags: [Charities]
 *     description: Returns full charity details including active projects and the 3 most recent impact reports.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: c1d2e3f4-a5b6-7890-cdef-012345678901
 *     responses:
 *       200:
 *         description: Charity detail.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Charity'
 *                         - type: object
 *                           properties:
 *                             projects:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Project'
 *                             impactReports:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/ImpactReport'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  '/:id',
  [param('id').isUUID(4).withMessage('Invalid charity ID')],
  validate,
  charityController.getCharity
);

/**
 * @swagger
 * /charities:
 *   post:
 *     summary: Register a new charity
 *     tags: [Charities]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Creates a charity with `status: pending`. An admin must approve it before it appears
 *       publicly or can receive donations. One user can register multiple charities.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, category]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Helping Hands Foundation
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@helpinghands.org
 *               description:
 *                 type: string
 *                 example: We provide education to underprivileged children.
 *               mission:
 *                 type: string
 *                 example: Education for every child.
 *               category:
 *                 type: string
 *                 enum: [education, health, environment, poverty, disaster, animals, other]
 *                 example: education
 *               location:
 *                 type: string
 *                 example: Mumbai, Maharashtra
 *               registrationNumber:
 *                 type: string
 *                 example: NGO-MH-20234567
 *               goalAmount:
 *                 type: number
 *                 example: 500000
 *               websiteUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://helpinghands.org
 *     responses:
 *       201:
 *         description: Charity registered — pending admin approval.
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
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  verifyToken,
  [
    body('name').trim().notEmpty().withMessage('Charity name required'),
    body('email').isEmail().normalizeEmail(),
    body('description').optional().trim(),
    body('mission').optional().trim(),
    body('category').isIn(CATEGORIES).withMessage('Invalid category'),
    body('location').optional().trim(),
    body('registrationNumber').optional().trim(),
    body('goalAmount').optional().isDecimal(),
    body('websiteUrl').optional().isURL(),
  ],
  validate,
  charityController.createCharity
);

/**
 * @swagger
 * /charities/{id}:
 *   put:
 *     summary: Update a charity (owner only)
 *     tags: [Charities]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               name:        { type: string,  example: Helping Hands Foundation v2 }
 *               description: { type: string }
 *               mission:     { type: string }
 *               category:
 *                 type: string
 *                 enum: [education, health, environment, poverty, disaster, animals, other]
 *               location:    { type: string,  example: Pune, Maharashtra }
 *               goalAmount:  { type: number,  example: 750000 }
 *               websiteUrl:  { type: string,  format: uri }
 *     responses:
 *       200:
 *         description: Charity updated.
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
router.put(
  '/:id',
  verifyToken,
  [
    param('id').isUUID(4).withMessage('Invalid charity ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('mission').optional().trim(),
    body('category').optional().isIn(CATEGORIES),
    body('location').optional().trim(),
    body('goalAmount').optional().isDecimal(),
    body('websiteUrl').optional().isURL(),
  ],
  validate,
  charityController.updateCharity
);

/**
 * @swagger
 * /charities/{id}/projects:
 *   post:
 *     summary: Add a project to a charity (owner only)
 *     tags: [Charities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Charity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, targetAmount]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Build a School in Dharavi
 *               description:
 *                 type: string
 *                 example: Construct a 10-room school serving 400 children.
 *               targetAmount:
 *                 type: number
 *                 example: 200000
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://cdn.givehope.com/projects/school.jpg
 *     responses:
 *       201:
 *         description: Project created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/:id/projects',
  verifyToken,
  [
    param('id').isUUID(4).withMessage('Invalid charity ID'),
    body('title').trim().notEmpty().withMessage('Project title required'),
    body('description').optional().trim(),
    body('targetAmount').isDecimal().withMessage('Target amount required'),
    body('imageUrl').optional().isURL(),
  ],
  validate,
  charityController.addProject
);

/**
 * @swagger
 * /charities/{id}/projects/{pid}:
 *   put:
 *     summary: Update a charity project (owner only)
 *     tags: [Charities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Charity ID
 *       - in: path
 *         name: pid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:        { type: string }
 *               description:  { type: string }
 *               targetAmount: { type: number, example: 250000 }
 *               status:
 *                 type: string
 *                 enum: [active, completed, paused]
 *     responses:
 *       200:
 *         description: Project updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
  '/:id/projects/:pid',
  verifyToken,
  [
    param('id').isUUID(4).withMessage('Invalid charity ID'),
    param('pid').isUUID(4).withMessage('Invalid project ID'),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('targetAmount').optional().isDecimal(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  validate,
  charityController.updateProject
);

/**
 * @swagger
 * /charities/{id}/donations:
 *   get:
 *     summary: List donations received by a charity (owner only)
 *     tags: [Charities]
 *     security:
 *       - bearerAuth: []
 *     description: "Anonymous donors are returned as `{ name: 'Anonymous Donor' }`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated donation list for this charity.
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
 *                         $ref: '#/components/schemas/Donation'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id/donations',
  verifyToken,
  [param('id').isUUID(4).withMessage('Invalid charity ID')],
  validate,
  charityController.getCharityDonations
);

/**
 * @swagger
 * /charities/{id}/impact-reports:
 *   post:
 *     summary: Post an impact report (owner only)
 *     tags: [Charities]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Creates an impact report and sends an in-app notification + email to all users
 *       who have completed donations to this charity.
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
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: 500 children enrolled in Q1 2024
 *               content:
 *                 type: string
 *                 example: Thanks to your support, we enrolled 500 children this quarter.
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://cdn.givehope.com/reports/q1.jpg
 *     responses:
 *       201:
 *         description: Impact report created and donors notified.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ImpactReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/:id/impact-reports',
  verifyToken,
  [
    param('id').isUUID(4).withMessage('Invalid charity ID'),
    body('title').trim().notEmpty().withMessage('Report title required'),
    body('content').trim().notEmpty().withMessage('Report content required'),
    body('imageUrl').optional().isURL(),
  ],
  validate,
  charityController.addImpactReport
);

/**
 * @swagger
 * /charities/{id}/impact-reports:
 *   get:
 *     summary: List impact reports for a charity
 *     tags: [Charities]
 *     description: Public endpoint. Newest reports first.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated impact reports.
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
 *                         $ref: '#/components/schemas/ImpactReport'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  '/:id/impact-reports',
  [param('id').isUUID(4).withMessage('Invalid charity ID')],
  validate,
  charityController.listImpactReports
);

module.exports = router;
