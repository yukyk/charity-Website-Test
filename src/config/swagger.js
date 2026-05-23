const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GiveHope Charity Donation Platform API',
      version: '1.0.0',
      description:
        'REST API for the GiveHope charity donation platform.\n\n' +
        '**Authentication:** Most endpoints require a JWT access token in the `Authorization: Bearer <token>` header. ' +
        'Obtain tokens via `POST /auth/login`. Access tokens expire in 15 minutes; use `POST /auth/refresh-token` to renew.\n\n' +
        '**Payment gateways:** Razorpay (primary, INR) and Stripe (secondary, international).\n\n' +
        '**Rate limits:** Global 100 req/15min · Auth routes 5 req/15min.',
      contact: { name: 'GiveHope Support', email: 'support@givehope.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Development' },
      { url: 'https://api.givehope.com/api/v1', description: 'Production' },
    ],
    tags: [
      { name: 'Auth',          description: 'Registration, login, and token management' },
      { name: 'Users',         description: 'User profile and donation history' },
      { name: 'Charities',     description: 'Charity discovery, registration, and management' },
      { name: 'Donations',     description: 'Razorpay and Stripe payment flows' },
      { name: 'Admin',         description: 'Platform administration — requires `admin` role' },
      { name: 'Notifications', description: 'In-app notification management' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from `POST /auth/login`. Expires in 15 minutes.',
        },
      },
      schemas: {
        // ── Primitives / shared ─────────────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 42 },
            page:       { type: 'integer', example: 2 },
            totalPages: { type: 'integer', example: 5 },
            limit:      { type: 'integer', example: 10 },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string',  example: 'Operation successful.' },
            data:    {},
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Something went wrong.' },
            errors:  { type: 'array',   items: { type: 'object' }, nullable: true },
          },
        },
        // ── Domain models ───────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid',      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
            name:       { type: 'string',                      example: 'Jane Doe' },
            email:      { type: 'string', format: 'email',     example: 'jane@example.com' },
            phone:      { type: 'string', nullable: true,      example: '+91-9876543210' },
            address:    { type: 'string', nullable: true,      example: '42 MG Road, Bengaluru' },
            role:       { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isVerified: { type: 'boolean',                     example: true },
            createdAt:  { type: 'string', format: 'date-time', example: '2024-06-01T10:00:00.000Z' },
            updatedAt:  { type: 'string', format: 'date-time', example: '2024-06-15T12:30:00.000Z' },
          },
        },
        Charity: {
          type: 'object',
          properties: {
            id:                 { type: 'string', format: 'uuid',   example: 'c1d2e3f4-a5b6-7890-cdef-012345678901' },
            name:               { type: 'string',                   example: 'Helping Hands Foundation' },
            email:              { type: 'string', format: 'email',  example: 'contact@helpinghands.org' },
            description:        { type: 'string', nullable: true,   example: 'We provide education to underprivileged children.' },
            mission:            { type: 'string', nullable: true,   example: 'Education for every child.' },
            logoUrl:            { type: 'string', nullable: true,   example: 'https://cdn.givehope.com/logos/hh.png' },
            websiteUrl:         { type: 'string', nullable: true,   example: 'https://helpinghands.org' },
            category:           { type: 'string', enum: ['education','health','environment','poverty','disaster','animals','other'], example: 'education' },
            location:           { type: 'string', nullable: true,   example: 'Mumbai, Maharashtra' },
            registrationNumber: { type: 'string', nullable: true,   example: 'NGO-MH-20234567' },
            status:             { type: 'string', enum: ['pending','approved','rejected'], example: 'approved' },
            adminNote:          { type: 'string', nullable: true,   example: null },
            goalAmount:         { type: 'number', nullable: true,   example: 500000 },
            raisedAmount:       { type: 'number',                   example: 123456.75 },
            userId:             { type: 'string', format: 'uuid',   example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
            createdAt:          { type: 'string', format: 'date-time' },
            updatedAt:          { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid',  example: 'p1q2r3s4-t5u6-7890-vwxy-z01234567890' },
            title:        { type: 'string',                  example: 'Build a School in Dharavi' },
            description:  { type: 'string', nullable: true,  example: 'Construct a 10-room school serving 400 children.' },
            targetAmount: { type: 'number',                  example: 200000 },
            raisedAmount: { type: 'number',                  example: 85000 },
            imageUrl:     { type: 'string', nullable: true,  example: 'https://cdn.givehope.com/projects/school.jpg' },
            status:       { type: 'string', enum: ['active','completed','paused'], example: 'active' },
            charityId:    { type: 'string', format: 'uuid' },
            createdAt:    { type: 'string', format: 'date-time' },
            updatedAt:    { type: 'string', format: 'date-time' },
          },
        },
        Donation: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid',  example: 'd1e2f3a4-b5c6-7890-defa-012345678901' },
            amount:         { type: 'number',                  example: 500 },
            currency:       { type: 'string',                  example: 'INR' },
            status:         { type: 'string', enum: ['pending','completed','failed','refunded'], example: 'completed' },
            paymentGateway: { type: 'string', enum: ['razorpay','stripe'], example: 'razorpay' },
            paymentId:      { type: 'string', nullable: true,  example: 'pay_XXXXXXXXXXXXXXXX' },
            message:        { type: 'string', nullable: true,  example: 'Keep up the great work!' },
            isAnonymous:    { type: 'boolean',                 example: false },
            userId:         { type: 'string', format: 'uuid' },
            charityId:      { type: 'string', format: 'uuid' },
            projectId:      { type: 'string', format: 'uuid', nullable: true },
            createdAt:      { type: 'string', format: 'date-time' },
          },
        },
        ImpactReport: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid',  example: 'i1r2e3p4-o5r6-7890-abcd-ef1234567890' },
            title:     { type: 'string',                  example: '500 children enrolled in Q1 2024' },
            content:   { type: 'string',                  example: 'Thanks to your generous donations, we enrolled 500 children this quarter.' },
            imageUrl:  { type: 'string', nullable: true,  example: 'https://cdn.givehope.com/reports/q1.jpg' },
            charityId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid',  example: 'n1o2t3i4-f5y6-7890-abcd-ef1234567890' },
            type:      { type: 'string', enum: ['donation_confirmed','charity_approved','charity_rejected','impact_report','reminder'], example: 'donation_confirmed' },
            message:   { type: 'string',                  example: 'Your donation of ₹500.00 to Helping Hands Foundation was received. Thank you!' },
            isRead:    { type: 'boolean',                 example: false },
            userId:    { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid access token.',
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } },
        },
        Forbidden: {
          description: 'Authenticated but insufficient permissions.',
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found.',
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Request body or params failed validation.',
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } },
        },
        Conflict: {
          description: 'Resource already exists (duplicate email, etc.).',
          content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  apis: ['./src/routes/*.routes.js'],
};

module.exports = swaggerJsdoc(options);
