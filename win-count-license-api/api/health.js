// api/health.js - แก้ไข CORS
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const now = new Date();
  
  // Check storage status
  const storageStatus = {
    pendingPurchases: global.pendingPurchases ? global.pendingPurchases.size : 0,
    completedPurchases: global.completedPurchases ? global.completedPurchases.size : 0,
    activeLicenses: global.activeLicenses ? global.activeLicenses.size : 0
  };

  console.log(`🏥 Health check: ${now.toISOString()} | Storage: ${JSON.stringify(storageStatus)}`);

  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: now.toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    storage: storageStatus,
    endpoints: {
      create_purchase: '/api/create-purchase',
      check_payment: '/api/check-payment',
      verify_license: '/api/verify-license',
      health: '/api/health'
    }
  });
} 