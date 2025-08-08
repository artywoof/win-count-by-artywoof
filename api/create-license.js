// api/create-license.js - Admin endpoint for creating new licenses
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

  const { admin_key, machine_id, discord_id, duration_months = 1, notes } = req.body;

  // Admin authentication
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
    console.log('🔑 Creating license for machine:', machine_id, 'Discord:', discord_id);

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

    // Call create_license function
    const { data: newLicenseKey, error } = await supabase
      .rpc('create_license', {
        p_machine_id: machine_id,
        p_discord_id: discord_id,
        p_duration_months: duration_months,
        p_notes: notes
      });

    if (error) {
      console.error('❌ License creation error:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        valid: false
      });
    }

    console.log('✅ License created successfully:', newLicenseKey);

    res.status(201).json({
      success: true,
      license_info: {
        license_key: newLicenseKey,
        machine_id: machine_id,
        discord_id: discord_id,
        created_at: new Date().toISOString(),
        duration_months: duration_months,
        notes: notes
      },
      server_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ License creation failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

