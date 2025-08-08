// api/health.js - Health check endpoint for Vercel
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
  
  console.log(`🏥 Health check: ${now.toISOString()}`);

  res.status(200).json({
    success: true,
    message: 'Win Count License API is healthy',
    timestamp: now.toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      validate_license: '/api/validate-license',
      heartbeat: '/api/heartbeat',
      create_license: '/api/create-license'
    }
  });
}

