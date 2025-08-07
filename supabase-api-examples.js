// Supabase API Examples สำหรับ Win Count License System
// ใช้ Supabase JavaScript Client

import { createClient } from '@supabase/supabase-js'

// ตั้งค่า Supabase Client
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// ===== LICENSE VALIDATION =====
export async function validateLicense(licenseKey, machineId) {
  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('machine_id', machineId)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('❌ License validation error:', error)
      return { valid: false, error: error.message }
    }

    if (!data) {
      return { valid: false, message: 'License not found or invalid' }
    }

    // ตรวจสอบวันหมดอายุ
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    
    if (now > expiresAt) {
      // อัปเดตสถานะเป็น expired
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('license_key', licenseKey)

      return { 
        valid: false, 
        message: 'License expired',
        expired: true,
        expires_at: data.expires_at
      }
    }

    return {
      valid: true,
      license_info: {
        license_key: data.license_key,
        machine_id: data.machine_id,
        discord_id: data.discord_id,
        created_at: data.created_at,
        expires_at: data.expires_at,
        status: data.status
      }
    }

  } catch (error) {
    console.error('❌ License validation failed:', error)
    return { valid: false, error: error.message }
  }
}

// ===== HEARTBEAT UPDATE =====
export async function updateHeartbeat(licenseKey, machineId) {
  try {
    // เรียกใช้ function update_heartbeat
    const { data, error } = await supabase
      .rpc('update_heartbeat', {
        p_license_key: licenseKey,
        p_machine_id: machineId
      })

    if (error) {
      console.error('❌ Heartbeat update error:', error)
      return { success: false, error: error.message }
    }

    return {
      success: data,
      valid: data,
      server_time: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Heartbeat update failed:', error)
    return { success: false, error: error.message }
  }
}

// ===== CREATE NEW LICENSE =====
export async function createLicense(machineId, discordId, durationMonths = 1, notes = null) {
  try {
    // เรียกใช้ function create_license
    const { data, error } = await supabase
      .rpc('create_license', {
        p_machine_id: machineId,
        p_discord_id: discordId,
        p_duration_months: durationMonths,
        p_notes: notes
      })

    if (error) {
      console.error('❌ License creation error:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      license_key: data,
      machine_id: machineId,
      discord_id: discordId,
      duration_months: durationMonths
    }

  } catch (error) {
    console.error('❌ License creation failed:', error)
    return { success: false, error: error.message }
  }
}

// ===== LIST LICENSES (ADMIN) =====
export async function listLicenses(status = null, limit = 100, offset = 0) {
  try {
    let query = supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ License listing error:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      licenses: data.map(license => ({
        id: license.id,
        license_key: license.license_key,
        machine_id: license.machine_id,
        discord_id: license.discord_id,
        created_at: license.created_at,
        expires_at: license.expires_at,
        status: license.status,
        last_heartbeat: license.last_heartbeat,
        heartbeat_count: license.heartbeat_count,
        notes: license.notes,
        days_remaining: license.expires_at ? 
          Math.ceil((new Date(license.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : null
      }))
    }

  } catch (error) {
    console.error('❌ License listing failed:', error)
    return { success: false, error: error.message }
  }
}

// ===== REVOKE LICENSE =====
export async function revokeLicense(licenseKey, reason = null) {
  try {
    const { data, error } = await supabase
      .from('licenses')
      .update({ 
        status: 'revoked',
        notes: reason ? `${data.notes || ''}\n[REVOKED] ${reason}` : `${data.notes || ''}\n[REVOKED]`
      })
      .eq('license_key', licenseKey)
      .select()

    if (error) {
      console.error('❌ License revocation error:', error)
      return { success: false, error: error.message }
    }

    if (data.length === 0) {
      return { success: false, message: 'License not found' }
    }

    return {
      success: true,
      message: 'License revoked successfully',
      license_key: licenseKey
    }

  } catch (error) {
    console.error('❌ License revocation failed:', error)
    return { success: false, error: error.message }
  }
}

// ===== USAGE EXAMPLES =====

// ตัวอย่างการใช้งาน
async function examples() {
  // 1. สร้าง License ใหม่
  const newLicense = await createLicense(
    'machine-001', 
    '123456789012345678', // Discord ID
    12, // 12 เดือน
    'Discord: ArtYWoof#1234'
  )
  console.log('New License:', newLicense)

  // 2. ตรวจสอบ License
  const validation = await validateLicense(
    newLicense.license_key, 
    'machine-001'
  )
  console.log('Validation:', validation)

  // 3. อัปเดต Heartbeat
  const heartbeat = await updateHeartbeat(
    newLicense.license_key, 
    'machine-001'
  )
  console.log('Heartbeat:', heartbeat)

  // 4. ดู Licenses ทั้งหมด
  const licenses = await listLicenses('active')
  console.log('Active Licenses:', licenses)
}

// Export functions
export {
  validateLicense,
  updateHeartbeat,
  createLicense,
  listLicenses,
  revokeLicense
}
