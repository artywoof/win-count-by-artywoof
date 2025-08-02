use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub key: String,
    pub machine_id: String,
    pub activated_at: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivationRequest {
    pub license_key: String,
    pub machine_id: String,
    pub app_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivationResponse {
    pub success: bool,
    pub message: String,
    pub expires_at: Option<String>,
}

// สร้าง Machine ID
pub fn get_machine_id() -> Result<String, String> {
    match machine_uid::get() {
        Ok(id) => {
            let mut hasher = Sha256::new();
            hasher.update(format!("WinCount-{}", id));
            Ok(hex::encode(hasher.finalize())[..16].to_string())
        }
        Err(e) => Err(format!("Failed to get machine ID: {}", e))
    }
}

// ตรวจสอบรูปแบบ License Key
pub fn validate_license_format(key: &str) -> bool {
    // Format: WC-2025-XXXXX-XXXX
    let parts: Vec<&str> = key.split('-').collect();
    if parts.len() != 4 {
        return false;
    }
    
    parts[0] == "WC" && 
    parts[1] == "2025" && 
    parts[2].len() == 5 && 
    parts[3].len() == 4
}

// บันทึก License
pub fn save_license(license: &LicenseInfo) -> Result<(), String> {
    let license_path = get_license_path()?;
    let license_json = serde_json::to_string_pretty(license)
        .map_err(|e| format!("Failed to serialize license: {}", e))?;
    
    fs::write(license_path, license_json)
        .map_err(|e| format!("Failed to save license: {}", e))
}

// อ่าน License
pub fn load_license() -> Result<LicenseInfo, String> {
    let license_path = get_license_path()?;
    
    if !license_path.exists() {
        return Err("No license found".to_string());
    }
    
    let license_data = fs::read_to_string(license_path)
        .map_err(|e| format!("Failed to read license: {}", e))?;
    
    serde_json::from_str(&license_data)
        .map_err(|e| format!("Failed to parse license: {}", e))
}

// ลบ License
pub fn remove_license() -> Result<(), String> {
    let license_path = get_license_path()?;
    
    if license_path.exists() {
        fs::remove_file(license_path)
            .map_err(|e| format!("Failed to remove license: {}", e))
    } else {
        Ok(())
    }
}

// Path ของไฟล์ License
fn get_license_path() -> Result<PathBuf, String> {
    let app_data_dir = dirs::data_local_dir()
        .ok_or("Failed to get local data directory")?
        .join("Win Count by ArtYWoof");
    
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }
    
    Ok(app_data_dir.join("license.json"))
}

// ตรวจสอบ License กับ Server
pub async fn verify_license_online(license_key: &str, machine_id: &str) -> Result<bool, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .post("https://api.wincount.artywoof.com/verify")
        .json(&serde_json::json!({
            "license_key": license_key,
            "machine_id": machine_id,
            "app_version": env!("CARGO_PKG_VERSION")
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;
    
    if response.status().is_success() {
        let result: ActivationResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        
        Ok(result.success)
    } else {
        Err("License verification failed".to_string())
    }
}

// Activate License
pub async fn activate_license(license_key: &str) -> Result<LicenseInfo, String> {
    // ตรวจสอบรูปแบบ
    if !validate_license_format(license_key) {
        return Err("Invalid license key format".to_string());
    }
    
    // ดึง Machine ID
    let machine_id = get_machine_id()?;
    
    // ตรวจสอบกับ Server
    if !verify_license_online(license_key, &machine_id).await? {
        return Err("License activation failed".to_string());
    }
    
    // สร้าง License Info
    let license = LicenseInfo {
        key: license_key.to_string(),
        machine_id,
        activated_at: chrono::Utc::now().to_rfc3339(),
        status: "active".to_string(),
    };
    
    // บันทึก License
    save_license(&license)?;
    
    Ok(license)
}

// ตรวจสอบ License ที่มีอยู่
pub async fn check_license_status() -> Result<bool, String> {
    // อ่าน License ที่บันทึกไว้
    let license = load_license()?;
    
    // ตรวจสอบกับ Server
    verify_license_online(&license.key, &license.machine_id).await
} 