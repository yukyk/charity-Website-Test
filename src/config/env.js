// These vars are always required — the app cannot function without them.
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
];

// These vars are optional — missing ones disable the related feature with a warning.
const OPTIONAL_GROUPS = {
  'Email (SendGrid)':    ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'SENDGRID_FROM_NAME'],
  'Payments (Razorpay)': ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'],
  'Payments (Stripe)':   ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
};

function validateEnv() {
  // Hard stop — exit if any required var is absent
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

  // Soft warn — optional groups: log disabled features but keep going
  for (const [group, vars] of Object.entries(OPTIONAL_GROUPS)) {
    const absent = vars.filter((k) => !process.env[k]);
    if (absent.length > 0) {
      console.warn(`[ENV] ${group} disabled — missing: ${absent.join(', ')}`);
    }
  }

  console.log('[ENV] Environment validated.');
}

// Feature flags — used by services to guard against unconfigured gateways
const isEmailEnabled   = () => !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
const isRazorpayEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const isStripeEnabled   = () => !!process.env.STRIPE_SECRET_KEY;

module.exports = { validateEnv, isEmailEnabled, isRazorpayEnabled, isStripeEnabled };
