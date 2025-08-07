// api/validate-license.js - License validation endpoint
import Database from "better-sqlite3";

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
      message: 'Missing required fields (license_key, machine_id)',
      valid: false
    });
  }

  try {
    console.log('🔍 Validating license:', license_key, 'Machine:', machine_id);

    // Initialize SQLite database (use temporary file for serverless)
    const db = new Database(':memory:');
    
    // Create licenses table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT NOT NULL,
        license_key TEXT UNIQUE NOT NULL,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
      )
    `);

    // Query license from database
    const license = db.prepare(`
      SELECT * FROM licenses 
      WHERE license_key = ? AND machine_id = ? AND status = 'active'
    `).get(license_key, machine_id);

    if (!license) {
      console.log('❌ License not found or invalid:', license_key);
      return res.status(404).json({
        success: false,
        message: 'License not found or invalid',
        valid: false
      });
    }

    // Check if license is expired
    if (license.expires_at && new Date() > new Date(license.expires_at)) {
      console.log('❌ License expired:', license_key);
      
      // Update status to expired
      db.prepare(`
        UPDATE licenses 
        SET status = 'expired' 
        WHERE license_key = ?
      `).run(license_key);

      return res.status(403).json({
        success: false,
        message: 'License expired',
        valid: false,
        expired: true,
        expires_at: license.expires_at
      });
    }

    console.log('✅ License validated successfully:', license_key);

    res.status(200).json({
      success: true,
      valid: true,
      license_info: {
        license_key: license.license_key,
        machine_id: license.machine_id,
        email: license.email,
        created_at: license.created_at,
        expires_at: license.expires_at,
        status: license.status
      },
      server_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ License validation failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      valid: false,
      timestamp: new Date().toISOString()
    });
  }
}
