const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '../templates/emails');

// ── Helpers ───────────────────────────────────────────────────────────────────

function frontendUrl() {
  // FRONTEND_URL env preferred; fall back to first ALLOWED_ORIGINS entry
  return (
    process.env.FRONTEND_URL ||
    (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')[0].trim()
  );
}

function loadTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATE_DIR, `${name}.html`), 'utf8');
}

function interpolate(html, vars) {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val ?? ''),
    html
  );
}

async function send({ to, subject, html }) {
  // Error #7 — from email must be a verified sender in SendGrid dashboard
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name:  process.env.SENDGRID_FROM_NAME || 'GiveHope',
    },
    subject,
    html,
  });
}

// ── Public functions ──────────────────────────────────────────────────────────

/**
 * Sent on registration — contains the email verification CTA.
 */
async function sendVerificationEmail(user, token) {
  const verificationUrl = `${frontendUrl()}/verify-email?token=${token}`;
  const html = interpolate(loadTemplate('welcome'), {
    name:            user.name,
    verificationUrl,
    year:            new Date().getFullYear(),
  });
  await send({ to: user.email, subject: 'Welcome to GiveHope — Verify your email', html });
}

/**
 * Sent on forgot-password — contains the password reset CTA.
 */
async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${frontendUrl()}/reset-password?token=${token}`;
  const html = interpolate(loadTemplate('password-reset'), {
    name:     user.name,
    resetUrl,
    year:     new Date().getFullYear(),
  });
  await send({ to: user.email, subject: 'GiveHope — Reset your password', html });
}

/**
 * Sent when a donation is completed.
 */
async function sendDonationConfirmation(user, donation, charity) {
  const amount   = parseFloat(donation.amount).toLocaleString('en-IN', { style: 'currency', currency: donation.currency || 'INR' });
  const html = interpolate(loadTemplate('donation-confirmation'), {
    name:         user.name,
    charityName:  charity.name,
    amount,
    donationId:   donation.id,
    dashboardUrl: `${frontendUrl()}/dashboard`,
    year:         new Date().getFullYear(),
  });
  await send({ to: user.email, subject: `GiveHope — Thank you for donating to ${charity.name}!`, html });
}

/**
 * Sent when admin approves a charity.
 */
async function sendCharityApproved(user, charity) {
  const html = interpolate(loadTemplate('charity-approved'), {
    name:         user.name,
    charityName:  charity.name,
    dashboardUrl: `${frontendUrl()}/charity-dashboard`,
    year:         new Date().getFullYear(),
  });
  await send({ to: user.email, subject: `GiveHope — Your charity "${charity.name}" has been approved!`, html });
}

/**
 * Sent when admin rejects a charity.
 */
async function sendCharityRejected(user, charity, adminNote) {
  const html = interpolate(loadTemplate('charity-rejected'), {
    name:        user.name,
    charityName: charity.name,
    adminNote:   adminNote || 'No additional details provided.',
    year:        new Date().getFullYear(),
  });
  await send({ to: user.email, subject: `GiveHope — Update on your charity application`, html });
}

/**
 * Sent to all past donors when a charity posts an impact report.
 */
async function sendImpactReport(donors, charity, report) {
  const html = interpolate(loadTemplate('impact-report'), {
    charityName:  charity.name,
    reportTitle:  report.title,
    reportContent: report.content,
    charityUrl:   `${frontendUrl()}/charities/${charity.id}`,
    year:         new Date().getFullYear(),
  });

  // Batch-send — personalise subject per donor
  const sends = donors.map((donor) =>
    send({
      to:      donor.email,
      subject: `${charity.name} shared an impact report — see your difference!`,
      html:    interpolate(html, { name: donor.name }),
    }).catch((err) => console.error(`[email] impact-report to ${donor.email}:`, err.message))
  );

  await Promise.allSettled(sends);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDonationConfirmation,
  sendCharityApproved,
  sendCharityRejected,
  sendImpactReport,
};
