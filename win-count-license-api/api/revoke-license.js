// api/revoke-license.js - Admin endpoint for revoking licenses
import { Database } from "bun:sqlite";

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

  const { license_key, admin_key, reason } = req.body;

  // Admin authentication (simple key check)
  const ADMIN_KEY = process.env.ADMIN_KEY || 'artywoof_admin_2024';
  
  if (!admin_key || admin_key !== ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid admin key',
      valid: false
    });
  }

  if (!license_key) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: license_key',
      valid: false
    });
  }

  try {
    console.log('🚫 Revoking license:', license_key, 'Reason:', reason);

    // Initialize SQLite database
    const db = new Database('licenses.db');
    
    // Create licenses table if not exists
    db.run(`
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

    // Check if license exists
    const license = db.query(`
      SELECT * FROM licenses 
      WHERE license_key = ?
    `).get(license_key);

    if (!license) {
      console.log('❌ License not found:', license_key);
      return res.status(404).json({
        success: false,
        message: 'License not found',
        valid: false
      });
    }

    // Check if license is already revoked
    if (license.status === 'revoked') {
      console.log('⚠️ License already revoked:', license_key);
      return res.status(409).json({
        success: false,
        message: 'License is already revoked',
        license_info: {
          license_key: license.license_key,
          machine_id: license.machine_id,
          status: license.status,
          created_at: license.created_at,
          expires_at: license.expires_at
        }
      });
    }

    // Update license status to revoked
    db.run(`
      UPDATE licenses 
      SET status = 'revoked' 
      WHERE license_key = ?
    `, license_key);

    console.log('✅ License revoked successfully:', license_key);

    res.status(200).json({
      success: true,
      message: 'License revoked successfully',
      license_info: {
        license_key: license.license_key,
        machine_id: license.machine_id,
        email: license.email,
        created_at: license.created_at,
        expires_at: license.expires_at,
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        reason: reason || 'Admin revoked'
      },
      server_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ License revocation failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
