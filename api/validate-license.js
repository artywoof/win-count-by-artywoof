// api/validate-license.js - License validation endpoint for Vercel + Supabase
import { createClient } from '@supabase/supabase-js'

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

    // Query license from database
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .eq('machine_id', machine_id)
      .eq('status', 'active')
      .single();

    if (error || !license) {
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
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('license_key', license_key);

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
        discord_id: license.discord_id,
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

