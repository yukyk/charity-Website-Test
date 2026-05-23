// uuid v14 is pure ESM and cannot be require()'d; use a regex instead.
// This pattern matches UUID v4 exactly: version nibble = 4, variant nibble = 8|9|a|b.
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if the string is a valid UUID v4
 */
function isValidUUID(value) {
  return typeof value === 'string' && UUID_V4_RE.test(value);
}

/**
 * Formats a decimal number as a currency string (e.g. 1000 → "₹1,000.00")
 */
function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

/**
 * Parses pagination query params with safe defaults
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Strips HTML tags from a string to prevent XSS stored in DB
 */
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
}

module.exports = { isValidUUID, formatCurrency, parsePagination, stripHtml };
