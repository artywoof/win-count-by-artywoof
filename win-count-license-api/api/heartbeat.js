// api/heartbeat.js - Real-time license heartbeat endpoint
import Database from "better-sqlite3";
import { createHash } from "crypto";

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

  const { license_key, machine_id, timestamp, signature, app_version } = req.body;

  if (!license_key || !machine_id || !timestamp || !signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields (license_key, machine_id, timestamp, signature)',
      valid: false
    });
  }

  try {
    console.log('💓 Heartbeat from app version:', app_version, 'Machine:', machine_id);

    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(`${machine_id}:${timestamp}:${license_key}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('❌ Invalid signature in heartbeat:', machine_id);
      return res.status(403).json({
        success: false,
        message: 'Invalid signature',
        valid: false
      });
    }

    // Check timestamp (prevent replay attacks)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);
    
    // Allow 5 minutes time difference
    if (timeDiff > 5 * 60 * 1000) {
      console.log('❌ Timestamp too old in heartbeat:', machine_id);
      return res.status(403).json({
        success: false,
        message: 'Timestamp too old',
        valid: false
      });
    }

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
      console.log('❌ License not found in heartbeat:', license_key);
      return res.status(404).json({
        success: false,
        message: 'License not found or inactive',
        valid: false
      });
    }

    // Check if license is expired
    if (license.expires_at && new Date() > new Date(license.expires_at)) {
      console.log('❌ License expired in heartbeat:', license_key);
      
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

    console.log('✅ Heartbeat validated successfully:', license_key);

    res.status(200).json({
      success: true,
      valid: true,
      heartbeat_info: {
        license_key: license.license_key,
        machine_id: license.machine_id,
        status: license.status,
        expires_at: license.expires_at,
        last_heartbeat: new Date().toISOString()
      },
      server_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Heartbeat validation failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      valid: false,
      timestamp: new Date().toISOString()
    });
  }
}
