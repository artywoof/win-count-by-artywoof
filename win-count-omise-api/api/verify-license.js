// api/verify-license.js - License Verification API
const { 
  validateLicenseRequest, 
  checkRateLimit, 
  sanitizeErrorMessage,
  hashSensitiveData 
} = require('../utils/security');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP, 100, 60000)) { // 100 requests per minute
      return res.status(429).json({
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please try again later.'
      });
    }

    // Input validation
    try {
      validateLicenseRequest(req);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: sanitizeErrorMessage(validationError)
      });
    }

    const { license_key, machine_id } = req.body;

    // Initialize storage
    if (!global.activeLicenses) {
      global.activeLicenses = new Map();
    }

    // Find license
    const license = global.activeLicenses.get(license_key);

    if (!license) {
      return res.status(404).json({
        valid: false,
        expired: false,
        error: 'License not found'
      });
    }

    // Check if license is expired
    const now = new Date();
    const expiresAt = new Date(license.expires_at);
    const isExpired = now > expiresAt;

    // Check machine binding
    const isMachineBound = license.machine_id === machine_id;

    if (!isMachineBound) {
      return res.status(403).json({
        valid: false,
        expired: false,
        error: 'License not bound to this machine'
      });
    }

    if (isExpired) {
      return res.status(410).json({
        valid: false,
        expired: true,
        error: 'License has expired',
        expires_at: license.expires_at
      });
    }

    // License is valid
    const licenseInfo = {
      license_key: license.license_key,
      license_type: license.license_type,
      status: license.status,
      activated_at: license.activated_at,
      expires_at: license.expires_at,
      payment_provider: license.payment_provider,
      features: ['win_counting', 'overlay', 'hotkeys', 'presets']
    };

    console.log('✅ License verified successfully:', {
      license_key: license.license_key,
      machine_id: machine_id,
      valid: true,
      expires_at: license.expires_at
    });

    res.status(200).json({
      valid: true,
      expired: false,
      license_info: licenseInfo
    });

  } catch (error) {
    console.error('❌ License verification failed:', error);
    res.status(500).json({
      valid: false,
      expired: false,
      error: 'License verification failed',
      details: sanitizeErrorMessage(error)
    });
  }
} 