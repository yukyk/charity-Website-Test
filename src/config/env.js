const REQUIRED_VARS = [
  'NODE_ENV',
  'PORT',
  'ALLOWED_ORIGINS',
  // Database
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  // JWT
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRY',
  'JWT_REFRESH_EXPIRY',
  // SendGrid
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'SENDGRID_FROM_NAME',
  // Razorpay
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  // Stripe
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[ENV] Missing required environment variables:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }

  // JWT secret length guard — see Error #2 in CLAUDE.md
  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    console.error('[ENV] JWT_ACCESS_SECRET must be at least 32 characters');
    process.exit(1);
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error('[ENV] JWT_REFRESH_SECRET must be at least 32 characters');
    process.exit(1);
  }

  console.log('[ENV] All environment variables validated.');
}

module.exports = { validateEnv };
