// utils/security.js - Security Utilities

const crypto = require('crypto');

/**
 * Webhook Signature Verification
 * @param {Object} body - Request body
 * @param {string} signature - Webhook signature
 * @param {string} secret - Webhook secret
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
    
  return signature === expectedSignature;
}

/**
 * Input Validation for Payment Requests
 * @param {Object} req - Express request object
 * @returns {boolean} - True if validation passes
 * @throws {Error} - If validation fails
 */
function validatePaymentRequest(req) {
  const { machine_id, customer_email, payment_method } = req.body;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer_email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate payment method
  const allowedMethods = ['promptpay', 'truewallet', 'card'];
  if (!allowedMethods.includes(payment_method)) {
    throw new Error('Invalid payment method');
  }
  
  // Validate machine ID format
  if (!machine_id || machine_id.length < 8) {
    throw new Error('Invalid machine ID');
  }
  
  return true;
}

/**
 * Input Validation for License Verification
 * @param {Object} req - Express request object
 * @returns {boolean} - True if validation passes
 * @throws {Error} - If validation fails
 */
function validateLicenseRequest(req) {
  const { license_key, machine_id } = req.body;
  
  // Validate license key format
  const licenseRegex = /^MONTH-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!licenseRegex.test(license_key)) {
    throw new Error('Invalid license key format');
  }
  
  // Validate machine ID
  if (!machine_id || machine_id.length < 8) {
    throw new Error('Invalid machine ID');
  }
  
  return true;
}

/**
 * Rate Limiting Helper
 * @param {string} key - Rate limit key (IP, user ID, etc.)
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if request is allowed
 */
function checkRateLimit(key, maxRequests = 100, windowMs = 60000) {
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean old entries
  const userRequests = global.rateLimitStore.get(key) || [];
  const recentRequests = userRequests.filter(time => time > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  global.rateLimitStore.set(key, recentRequests);
  
  return true; // Request allowed
}

/**
 * Sanitize Error Messages
 * @param {Error} error - Original error
 * @returns {string} - Sanitized error message
 */
function sanitizeErrorMessage(error) {
  // Don't expose internal errors to client
  const safeMessages = {
    'Invalid email format': 'Invalid email format',
    'Invalid payment method': 'Invalid payment method',
    'Invalid machine ID': 'Invalid machine ID',
    'Invalid license key format': 'Invalid license key format',
    'Invalid signature': 'Invalid signature',
    'Method not allowed': 'Method not allowed'
  };
  
  return safeMessages[error.message] || 'An error occurred';
}

/**
 * Generate Secure Random String
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
function generateSecureRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash Sensitive Data
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
function hashSensitiveData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  verifyWebhookSignature,
  validatePaymentRequest,
  validateLicenseRequest,
  checkRateLimit,
  sanitizeErrorMessage,
  generateSecureRandomString,
  hashSensitiveData
}; 