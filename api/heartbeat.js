// api/heartbeat.js - Real-time license heartbeat endpoint for Vercel + Supabase
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

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

  const { license_key, machine_id, timestamp, signature } = req.body;

  if (!license_key || !machine_id || !timestamp || !signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields (license_key, machine_id, timestamp, signature)',
      valid: false
    });
  }

  try {
    console.log('💓 Heartbeat from machine:', machine_id);

    // Verify signature to prevent replay attacks
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

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        valid: false
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call update_heartbeat function
    const { data: heartbeatResult, error } = await supabase
      .rpc('update_heartbeat', {
        p_license_key: license_key,
        p_machine_id: machine_id
      });

    if (error) {
      console.error('❌ Heartbeat update error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        valid: false
      });
    }

    if (!heartbeatResult) {
      console.log('❌ License not found or inactive in heartbeat:', license_key);
      return res.status(404).json({
        success: false,
        message: 'License not found or inactive',
        valid: false
      });
    }

    console.log('✅ Heartbeat validated successfully:', license_key);

    res.status(200).json({
      success: true,
      valid: true,
      heartbeat_info: {
        license_key: license_key,
        machine_id: machine_id,
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

