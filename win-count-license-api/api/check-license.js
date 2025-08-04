export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license_key, machine_id } = req.body;

  if (!license_key || !machine_id) {
    return res.status(400).json({
      success: false,
      message: 'Missing license_key or machine_id'
    });
  }

  // VIP Lifetime Licenses
  const LIFETIME_LICENSES = [
    'LIFE-ARTY-A7K9M-3X8F',
    'LIFE-ARTY-B2N5P-7Y1R',
    'LIFE-ARTY-C8Q4W-9Z5T',
    'LIFE-ARTY-D3M7K-1A6H',
    'LIFE-ARTY-E9X2V-8B4N'
  ];

  // Check lifetime licenses first
  if (LIFETIME_LICENSES.includes(license_key)) {
    return res.status(200).json({
      success: true,
      valid: true,
      license_type: 'LIFETIME',
      expires_at: null,
      message: 'VIP Lifetime License verified successfully'
    });
  }

  // Check monthly licenses
  if (!global.activeLicenses) {
    global.activeLicenses = new Map();
  }

  const license = global.activeLicenses.get(license_key);

  if (!license) {
    return res.status(200).json({
      success: true,
      valid: false,
      message: 'License key not found or not activated'
    });
  }

  // Check machine binding
  if (license.machine_id !== machine_id) {
    return res.status(200).json({
      success: true,
      valid: false,
      message: 'License is bound to a different machine'
    });
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(license.expires_at);

  if (now > expiresAt) {
    // Mark as expired
    license.status = 'EXPIRED';
    
    return res.status(200).json({
      success: true,
      valid: false,
      message: 'License has expired. Please renew your subscription.',
      expired_at: license.expires_at
    });
  }

  // Update last check time
  license.last_checked = new Date().toISOString();

  const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

  return res.status(200).json({
    success: true,
    valid: true,
    license_type: license.license_type,
    expires_at: license.expires_at,
    days_remaining: daysRemaining,
    customer_email: license.customer_email,
    activated_at: license.activated_at,
    message: `License verified successfully. ${daysRemaining} days remaining.`
  });
} 