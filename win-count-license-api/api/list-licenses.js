// api/list-licenses.js - Admin endpoint for listing all licenses
import { Database } from "bun:sqlite";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { admin_key, status, limit = 100, offset = 0 } = req.query;

  // Admin authentication (simple key check)
  const ADMIN_KEY = process.env.ADMIN_KEY || 'artywoof_admin_2024';
  
  if (!admin_key || admin_key !== ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid admin key',
      valid: false
    });
  }

  try {
    console.log('📋 Listing licenses with filters:', { status, limit, offset });

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

    // Build query based on filters
    let query = 'SELECT * FROM licenses';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    // Get licenses
    const licenses = db.query(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM licenses';
    let countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    
    const totalCount = db.query(countQuery).get(...countParams);

    console.log('✅ Retrieved', licenses.length, 'licenses');

    res.status(200).json({
      success: true,
      licenses: licenses.map(license => ({
        id: license.id,
        license_key: license.license_key,
        machine_id: license.machine_id,
        email: license.email,
        created_at: license.created_at,
        expires_at: license.expires_at,
        status: license.status,
        days_remaining: license.expires_at ? 
          Math.ceil((new Date(license.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : null
      })),
      pagination: {
        total: totalCount.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: licenses.length === parseInt(limit)
      },
      filters: {
        status: status || 'all'
      },
      server_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ License listing failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
