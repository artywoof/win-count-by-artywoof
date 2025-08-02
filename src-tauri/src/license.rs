use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::fs;
use std::path::PathBuf;
use regex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseData {
    pub key: String,
    pub machine_id: String,
    pub activated_at: String,
    pub customer_info: Option<CustomerInfo>,
    pub expires_at: Option<String>,
    pub features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerInfo {
    pub name: String,
    pub email: String,
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
    pub features: Option<Vec<String>>,
    pub customer_info: Option<CustomerInfo>,
}

// Generate Machine ID
pub fn get_machine_id() -> Result<String, String> {
    match machine_uid::get() {
        Ok(id) => {
            let mut hasher = Sha256::new();
            hasher.update(format!("WinCount-ArtYWoof-{}", id));
            let hash = hex::encode(hasher.finalize());
            Ok(hash[..16].to_uppercase())
        }
        Err(e) => Err(format!("Failed to get machine ID: {}", e))
    }
}

// Validate License Format (Enhanced)
pub fn validate_license_format(key: &str) -> bool {
    // Format: WC-2025-XXXXX-XXXX or DEMO-XXXX-XXXX-XXXX or PRO-XXXX-XXXX-XXXX
    let patterns = [
        r"^WC-2025-[A-Z0-9]{5}-[A-Z0-9]{4}$",
        r"^DEMO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$",
        r"^PRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$",
    ];
    
    patterns.iter().any(|pattern| {
        regex::Regex::new(pattern)
            .map(|re| re.is_match(key))
            .unwrap_or(false)
    })
}

// Enhanced License Validation
pub async fn validate_license_online(license_key: &str, machine_id: &str) -> Result<ActivationResponse, String> {
    // Demo licenses (offline validation)
    if license_key == "DEMO-1234-5678-9ABC" {
        let expires_at = chrono::Utc::now() + chrono::Duration::days(30);
        return Ok(ActivationResponse {
            success: true,
            message: "Demo license activated".to_string(),
            expires_at: Some(expires_at.to_rfc3339()),
            features: Some(vec!["basic".to_string(), "premium".to_string()]),
            customer_info: Some(CustomerInfo {
                name: "Demo User".to_string(),
                email: "demo@example.com".to_string(),
            }),
        });
    }
    
    if license_key == "PRO-2024-ARTY-WOOF" {
        let expires_at = chrono::Utc::now() + chrono::Duration::days(365);
        return Ok(ActivationResponse {
            success: true,
            message: "Pro license activated".to_string(),
            expires_at: Some(expires_at.to_rfc3339()),
            features: Some(vec!["basic".to_string(), "premium".to_string(), "enterprise".to_string()]),
            customer_info: Some(CustomerInfo {
                name: "ArtYWoof".to_string(),
                email: "artywoof@example.com".to_string(),
            }),
        });
    }
    
    // Online validation for other keys
    let client = reqwest::Client::new();
    let request = ActivationRequest {
        license_key: license_key.to_string(),
        machine_id: machine_id.to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    };
    
    match client
        .post("http://localhost:3001/verify") // Change to your server URL
        .json(&request)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<ActivationResponse>().await {
                    Ok(result) => Ok(result),
                    Err(e) => Err(format!("Failed to parse response: {}", e)),
                }
            } else {
                Err("License server returned error".to_string())
            }
        }
        Err(e) => Err(format!("Network error: {}", e)),
    }
}

// Save License
pub fn save_license(license: &LicenseData) -> Result<(), String> {
    let license_path = get_license_path()?;
    
    // Encrypt license data (basic obfuscation)
    let license_json = serde_json::to_string(license)
        .map_err(|e| format!("Failed to serialize license: {}", e))?;
    
    let encoded = base64::encode(license_json);
    
    fs::write(license_path, encoded)
        .map_err(|e| format!("Failed to save license: {}", e))
}

// Load License
pub fn load_license() -> Result<LicenseData, String> {
    let license_path = get_license_path()?;
    
    if !license_path.exists() {
        return Err("No license found".to_string());
    }
    
    let encoded_data = fs::read_to_string(license_path)
        .map_err(|e| format!("Failed to read license: {}", e))?;
    
    let license_json = base64::decode(encoded_data)
        .map_err(|e| format!("Failed to decode license: {}", e))?;
    
    let license_str = String::from_utf8(license_json)
        .map_err(|e| format!("Invalid license format: {}", e))?;
    
    serde_json::from_str(&license_str)
        .map_err(|e| format!("Failed to parse license: {}", e))
}

// License Path
fn get_license_path() -> Result<PathBuf, String> {
    let app_data_dir = dirs::data_local_dir()
        .ok_or("Failed to get local data directory")?
        .join("Win Count by ArtYWoof");
    
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }
    
    Ok(app_data_dir.join(".license"))
}

// Activate License
pub async fn activate_license(license_key: &str) -> Result<LicenseData, String> {
    // Validate format
    if !validate_license_format(license_key) {
        return Err("Invalid license key format".to_string());
    }
    
    // Get machine ID
    let machine_id = get_machine_id()?;
    
    // Check if already activated on this machine
    if let Ok(existing_license) = load_license() {
        if existing_license.key == license_key && existing_license.machine_id == machine_id {
            return Ok(existing_license);
        }
    }
    
    // Validate with server
    let response = validate_license_online(license_key, &machine_id).await?;
    
    if !response.success {
        return Err(response.message);
    }
    
    // Create license data
    let license = LicenseData {
        key: license_key.to_string(),
        machine_id,
        activated_at: chrono::Utc::now().to_rfc3339(),
        customer_info: response.customer_info,
        expires_at: response.expires_at,
        features: response.features.unwrap_or_default(),
    };
    
    // Save license
    save_license(&license)?;
    
    Ok(license)
}

// Check License Status
pub async fn check_license_status() -> Result<bool, String> {
    let license = load_license()?;
    
    // Check expiration
    if let Some(expires_at) = &license.expires_at {
        let expires = chrono::DateTime::parse_from_rfc3339(expires_at)
            .map_err(|e| format!("Invalid expiration date: {}", e))?;
        
        if chrono::Utc::now() > expires {
            return Err("License has expired".to_string());
        }
    }
    
    // Periodic validation with server (optional)
    match validate_license_online(&license.key, &license.machine_id).await {
        Ok(response) => Ok(response.success),
        Err(_) => {
            // If server is unavailable, use cached license
            Ok(true)
        }
    }
} 