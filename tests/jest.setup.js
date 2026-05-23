// Sets NODE_ENV and all required env vars before any module is loaded.
// This file runs via jest's `setupFiles` — before each test file's imports.

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
process.env.FRONTEND_URL = 'http://localhost:5173';

// JWT — must be >= 32 chars (env.js enforces this in production startup)
process.env.JWT_ACCESS_SECRET  = 'test_access_secret_minimum_32_characters_long!!';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_characters_long!!';
process.env.JWT_ACCESS_EXPIRY  = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

// DB — values unused in test mode (SQLite branch in database.js is used instead)
process.env.DB_HOST     = 'localhost';
process.env.DB_PORT     = '3306';
process.env.DB_NAME     = 'givehope_test';
process.env.DB_USER     = 'root';
process.env.DB_PASSWORD = 'test';

// Payment — mocked in test files; env vars silently referenced in payment.service
process.env.RAZORPAY_KEY_ID        = 'rzp_test_testkey';
process.env.RAZORPAY_KEY_SECRET    = 'testsecretkey12345';
process.env.RAZORPAY_WEBHOOK_SECRET = 'testwebhooksecret12345';
process.env.STRIPE_SECRET_KEY      = 'sk_test_testkey';
process.env.STRIPE_WEBHOOK_SECRET  = 'whsec_testwebhooksecret';

// Email — mocked in test files; env vars read at send() time
process.env.SENDGRID_API_KEY    = 'SG.testkey';
process.env.SENDGRID_FROM_EMAIL = 'test@givehope.com';
process.env.SENDGRID_FROM_NAME  = 'GiveHope Test';
