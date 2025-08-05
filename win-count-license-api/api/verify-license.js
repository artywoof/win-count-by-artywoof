// api/verify-license.js - Updated for Omise integration
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
      message: 'Missing required fields (license_key, machine_id)'
    });
  }

  try {
    console.log('🔍 Verifying license:', license_key, 'Machine:', machine_id);

    // Initialize storage
    if (!global.activeLicenses) {
      global.activeLicenses = new Map();
    }

    // Check if license exists and is active
    const license = global.activeLicenses.get(license_key);

    if (!license) {
      return res.status(404).json({
        success: false,
        message: 'License not found',
        valid: false
      });
    }

    // Check if license belongs to this machine
    if (license.machine_id !== machine_id) {
      return res.status(403).json({
        success: false,
        message: 'License not valid for this machine',
        valid: false
      });
    }

    // Check if license is expired
    if (license.expires_at && new Date() > new Date(license.expires_at)) {
      return res.status(403).json({
        success: false,
        message: 'License expired',
        valid: false,
        expired: true,
        expires_at: license.expires_at
      });
    }

    console.log('✅ License verified successfully:', license_key);

    res.status(200).json({
      success: true,
      valid: true,
      license_info: {
        license_key: license.license_key,
        license_type: license.license_type,
        customer_email: license.customer_email,
        activated_at: license.activated_at,
        expires_at: license.expires_at,
        status: license.status,
        payment_provider: license.payment_provider,
        features: ['win_counting', 'hotkeys', 'overlay', 'presets', 'auto_save']
      },
      server_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ License verification failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 