// api/generate-license.js - Admin endpoint for generating licenses
import { Database } from "bun:sqlite";
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

  const { machine_id, email, duration_months = 1, admin_key } = req.body;

  // Admin authentication (simple key check)
  const ADMIN_KEY = process.env.ADMIN_KEY || 'artywoof_admin_2024';
  
  if (!admin_key || admin_key !== ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid admin key',
      valid: false
    });
  }

  if (!machine_id) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: machine_id',
      valid: false
    });
  }

  try {
    console.log('🔑 Generating license for machine:', machine_id, 'Email:', email);

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

    // Check if machine already has an active license
    const existingLicense = db.query(`
      SELECT * FROM licenses 
      WHERE machine_id = ? AND status = 'active'
    `).get(machine_id);

    if (existingLicense) {
      console.log('⚠️ Machine already has active license:', machine_id);
      return res.status(409).json({
        success: false,
        message: 'Machine already has an active license',
        existing_license: {
          license_key: existingLicense.license_key,
          expires_at: existingLicense.expires_at,
          status: existingLicense.status
        }
      });
    }

    // Generate encrypted license key
    const timestamp = Date.now();
    const randomBytes = Math.random().toString(36).substring(2, 15);
    const licenseData = `${machine_id}:${timestamp}:${randomBytes}`;
    
    // Create SHA-256 hash as license key
    const licenseKey = createHash('sha256')
      .update(licenseData)
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + duration_months);

    // Insert new license into database
    db.run(`
      INSERT INTO licenses (machine_id, license_key, email, expires_at, status)
      VALUES (?, ?, ?, ?, 'active')
    `, machine_id, licenseKey, email || null, expiresAt.toISOString());

    console.log('✅ License generated successfully:', licenseKey);

    res.status(201).json({
      success: true,
      license_info: {
        license_key: licenseKey,
        machine_id: machine_id,
        email: email,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
        duration_months: duration_months
      },
      server_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ License generation failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
