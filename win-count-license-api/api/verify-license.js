// api/verify-license.js - แก้ไข CORS
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  console.log('📡 Verify license request:', req.body);

  const { license_key, machine_id } = req.body || {};
  
  if (!license_key || !machine_id) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields (license_key, machine_id)'
    });
    return;
  }

  // Initialize storage if needed
  if (!global.activeLicenses) {
    global.activeLicenses = new Map();
  }

  // Hardcoded lifetime licenses for VIP users
  const LIFETIME_LICENSES = [
    'LIFE-ARTY-A7K9M-3X8F',
    'LIFE-ARTY-B2N5P-7Y1R',
    'LIFE-ARTY-C8Q4W-9Z5T',
    'LIFE-ARTY-D3M7K-1A6H',
    'LIFE-ARTY-E9X2V-8B4N',
    'LIFE-ARTY-F5L8P-2C9M',
    'LIFE-ARTY-G6H1Q-7D3K',
    'LIFE-ARTY-H4R9W-5E8L',
    'LIFE-ARTY-J7T3Y-9F2P',
    'LIFE-ARTY-K1S6U-4G7Q'
  ];

  // Check lifetime licenses first
  if (LIFETIME_LICENSES.includes(license_key)) {
    console.log(`✅ Lifetime license verified: ${license_key}`);
    res.status(200).json({
      success: true,
      message: 'License verified successfully',
      license_type: 'LIFETIME',
      expires_at: null,
      customer_name: 'VIP User'
    });
    return;
  }

  // Check monthly licenses
  const license = global.activeLicenses.get(license_key);
  if (!license) {
    console.log(`❌ License not found: ${license_key}`);
    res.status(400).json({
      success: false,
      message: 'Invalid license key or license not activated'
    });
    return;
  }

  // Check if license is bound to this machine
  if (license.machine_id !== machine_id) {
    console.log(`❌ License bound to different machine: ${license_key}`);
    res.status(400).json({
      success: false,
      message: 'License is registered to a different machine'
    });
    return;
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(license.expires_at);
  if (now > expiresAt) {
    console.log(`❌ License expired: ${license_key}`);
    res.status(400).json({
      success: false,
      message: 'License has expired. Please renew your subscription.'
    });
    return;
  }

  // Update last seen
  license.last_seen = new Date().toISOString();

  const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

  console.log(`✅ Monthly license verified: ${license_key} (${daysRemaining} days remaining)`);
  
  res.status(200).json({
    success: true,
    message: 'License verified successfully',
    license_type: 'MONTHLY',
    expires_at: license.expires_at,
    days_remaining: daysRemaining,
    customer_email: license.customer_email
  });
} 