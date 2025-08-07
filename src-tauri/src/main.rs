// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Anti-Debugging: Block debug builds in production
#[cfg(debug_assertions)]
compile_error!("Debug builds not allowed for production - use release build only");

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use std::collections::HashMap;
use tauri::{State, Emitter, Manager, menu::{MenuBuilder, MenuItemBuilder}};
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use tokio::sync::broadcast;
use futures_util::{StreamExt, SinkExt};
use tokio::runtime::Runtime;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::accept_async;
use serde_json;
use std::env;
use sha2::{Digest, Sha256};
use chrono::{Utc, DateTime};
use std::fs::File;
use std::io::{Read};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::atomic::AtomicBool;

// PromptPay module removed - using promptpay.io instead

// License system removed

#[cfg(windows)]
use winapi::um::winuser::{GetAsyncKeyState, VK_MENU, VK_OEM_PLUS, VK_OEM_MINUS};

// Function to get safe app data directory
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Security constants for obfuscation
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Security constants for obfuscation
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
const _dummy_var_1: u32 = 0xdeadbeef;
const _dummy_var_2: u32 = 0xcafebabe;
const _dummy_var_3: u32 = 0x12345678;
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
const _dummy_var_1: u32 = 0xdeadbeef;
const _dummy_var_2: u32 = 0xcafebabe;
const _dummy_var_3: u32 = 0x12345678;
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
const _dummy_var_1: u32 = 0xdeadbeef;
const _dummy_var_2: u32 = 0xcafebabe;
const _dummy_var_3: u32 = 0x12345678;
// Obfuscated code - do not modify
// Security layer 1
// Anti-tamper protection
// License validation system
// Heartbeat monitoring
// Machine ID verification
const _dummy_var_1: u32 = 0xdeadbeef;
const _dummy_var_2: u32 = 0xcafebabe;
const _dummy_var_3: u32 = 0x12345678;
fn get_app_data_dir() -> Result<PathBuf, String> {
    let app_data_dir = dirs::data_local_dir()
        .ok_or("Failed to get local data directory")?
        .join("Win Count by ArtYWoof");
    
    // Create directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }
    
    Ok(app_data_dir)
}

// Function to get file path in app data directory
fn get_app_data_file(filename: &str) -> Result<PathBuf, String> {
    let app_data_dir = get_app_data_dir()?;
    Ok(app_data_dir.join(filename))
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> Result<String, String> {
    // ตรวจสอบ License ก่อนให้เข้าถึงฟังก์ชันพื้นฐาน
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    Ok(format!("Hello, {}! You've been greeted from Rust!", name))
}

#[tauri::command]
fn get_app_version() -> Result<String, String> {
    // ตรวจสอบ License ก่อนให้เข้าถึงฟังก์ชันพื้นฐาน
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

// License management functions
const L1C3NS3_S3RV3R: &str = "https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/api";

// License validation function
fn x7y9z2() -> bool {
    // Check if license file exists and is valid
    if let Ok(license_path) = get_app_data_file("win_count_license.json") {
        if let Ok(license_content) = fs::read_to_string(&license_path) {
            if let Ok(license_data) = serde_json::from_str::<serde_json::Value>(&license_content) {
                if let Some(license_key) = license_data.get("license_key").and_then(|v| v.as_str()) {
                    // Enhanced validation - check with server
                    if let Ok(machine_id) = m4c5h6n() {
                        // Create a blocking runtime for synchronous validation
                        let rt = tokio::runtime::Runtime::new().unwrap();
                        let result = rt.block_on(async {
                            let client = reqwest::Client::new();
                            let url = format!("{}/verify-license", L1C3NS3_S3RV3R);
                            if !url.starts_with("https://") {
                                println!("[SECURITY] License server URL is not HTTPS!");
                                return false;
                            }
                            let response = client
                                .post(&url)
                                .header("Content-Type", "application/json")
                                .body(format!(
                                    r#"{{\"license_key\":\"{}\",\"machine_id\":\"{}\"}}"#,
                                    license_key, machine_id
                                ))
                                .send()
                                .await;
                            match response {
                                Ok(resp) => {
                                    let status = resp.status();
                                    let body = resp.text().await.unwrap_or_default();
                                    println!("[SECURITY] License server response: {} - {}", status, body);
                                    if status.is_success() {
                                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
                                            if let Some(success) = json.get("success").and_then(|v| v.as_bool()) {
                                                return success;
                                            }
                                        }
                                    }
                                    // ถ้า response ไม่ success
                                    println!("[SECURITY] License server returned error status: {}", status);
                                    // Activate Grace Period
                                    GR4C3_P3R10D.store(true, Ordering::SeqCst);
                                    unsafe { GRACE_PERIOD_START = Some(Utc::now()); }
                                    return false;
                                }
                                Err(e) => {
                                    println!("[SECURITY] Network error: {}", e);
                                    // Activate Grace Period
                                    GR4C3_P3R10D.store(true, Ordering::SeqCst);
                                    unsafe { GRACE_PERIOD_START = Some(Utc::now()); }
                                    return false;
                                }
                            }
                        });
                        return result;
                    }
                }
            }
        }
    }
    false
}

#[tauri::command]
async fn a1b2c3d4(license_key: String) -> Result<bool, String> {
    // ไม่ต้องตรวจสอบ License สำหรับการตรวจสอบ License Key เพราะเป็นฟังก์ชันการตรวจสอบ License
    println!("🔑 Validating license key: {}", license_key);
    
    // Get machine ID
    let machine_id = m4c5h6n()?;
    
    // Prepare request to license server
    let client = reqwest::Client::new();
    let url = format!("{}/verify-license", L1C3NS3_S3RV3R);
    if !url.starts_with("https://") {
        println!("[SECURITY] License server URL is not HTTPS!");
        return Err("License server URL is not HTTPS".to_string());
    }
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(format!(
            r#"{{\"license_key\":\"{}\",\"machine_id\":\"{}\"}}"#,
            license_key, machine_id
        ))
        .send()
        .await;
    
    match response {
        Ok(resp) => {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            println!("[SECURITY] License server response: {} - {}", status, body);
            if status.is_success() {
                // Parse response to check if license is valid
                match serde_json::from_str::<serde_json::Value>(&body) {
                    Ok(json) => {
                        // Check for success field first
                        if let Some(success) = json.get("success").and_then(|v| v.as_bool()) {
                            Ok(success)
                        } else if let Some(valid) = json.get("valid").and_then(|v| v.as_bool()) {
                            // Fallback to "valid" field
                            Ok(valid)
                        } else if let Some(status) = json.get("status").and_then(|v| v.as_str()) {
                            // Check status field
                            Ok(status == "valid" || status == "success")
                        } else {
                            // If no clear success indicator, check if response contains positive indicators
                            let body_lower = body.to_lowercase();
                            if body_lower.contains("valid") || body_lower.contains("success") || body_lower.contains("true") {
                                Ok(true)
                            } else {
                                Ok(false)
                            }
                        }
                    }
                    Err(e) => {
                        println!("❌ Failed to parse JSON response: {}", e);
                        Ok(false)
                    }
                }
            } else {
                println!("[SECURITY] License server returned error status: {}", status);
                // Activate Grace Period
                GR4C3_P3R10D.store(true, Ordering::SeqCst);
                unsafe { GRACE_PERIOD_START = Some(Utc::now()); }
                Ok(false)
            }
        }
        Err(e) => {
            println!("[SECURITY] Network error: {}", e);
            // Activate Grace Period
            GR4C3_P3R10D.store(true, Ordering::SeqCst);
            unsafe { GRACE_PERIOD_START = Some(Utc::now()); }
            Ok(false)
        }
    }
}

#[tauri::command]
fn s4v3k3y(key: String) -> Result<(), String> {
    // ไม่ต้องตรวจสอบ License สำหรับการบันทึก License Key เพราะเป็นฟังก์ชันการตั้งค่า License
    println!("💾 Saving license key: {}", key);
    
    // Save to app data directory
    let license_path = get_app_data_file("win_count_license.json")?;
    let license_data = serde_json::json!({
        "license_key": key,
        "saved_at": chrono::Utc::now().to_rfc3339(),
        "machine_id": m4c5h6n()?
    });
    
    let license_json = serde_json::to_string_pretty(&license_data)
        .map_err(|e| format!("Failed to serialize license data: {}", e))?;
    
    fs::write(license_path, license_json)
        .map_err(|e| format!("Failed to save license key: {}", e))?;
    
    println!("✅ License key saved successfully");
    Ok(())
}

#[tauri::command]
fn m4c5h6n() -> Result<String, String> {
    // ไม่ต้องตรวจสอบ License สำหรับการสร้าง Machine ID เพราะเป็นฟังก์ชันพื้นฐาน
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    use std::env;
    
    // Create a unique machine identifier based on system information
    let mut hasher = DefaultHasher::new();
    
    // Use computer name and username as base
    let computer_name = env::var("COMPUTERNAME").unwrap_or_else(|_| "unknown".to_string());
    let user_name = env::var("USERNAME").unwrap_or_else(|_| "unknown".to_string());
    
    computer_name.hash(&mut hasher);
    user_name.hash(&mut hasher);
    
    // Add some system-specific information
    #[cfg(windows)]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("wmic").args(&["csproduct", "get", "UUID"]).output() {
            if let Ok(uuid) = String::from_utf8(output.stdout) {
                uuid.hash(&mut hasher);
            }
        }
    }
    
    let machine_id = format!("{:x}", hasher.finish());
    println!("🖥️ Generated machine ID: {}", machine_id);
    Ok(machine_id)
}

// Payment system functions - now using the promptpay module
#[tauri::command]
async fn create_promptpay_qr(amount: f64, phone: String) -> Result<String, String> {
    // ไม่ต้องตรวจสอบ License สำหรับการสร้าง QR Code เพราะเป็นฟังก์ชันการชำระเงิน
    // Use promptpay.io directly
    let qr_url = format!("https://promptpay.io/{}/{}", phone, amount);
    Ok(qr_url)
}

// Payment status check removed - using promptpay.io instead

#[tauri::command]
fn update_hotkey(action: String, hotkey: String) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    
    println!("🎹 Updating hotkey: {} -> {}", action, hotkey);
    
    // Load existing hotkeys
    let mut hotkeys = load_custom_hotkeys();
    println!("📋 Current hotkeys before update: {:?}", hotkeys);
    
    // Update the specific action
    hotkeys.insert(action.clone(), hotkey.clone());
    
    // Save updated hotkeys
    save_custom_hotkeys(&hotkeys)?;
    println!("💾 Hotkeys saved to storage");
    
    println!("✅ Hotkey updated and saved: {} -> {}", action, hotkey);
    println!("✅ Hotkey saved - frontend will trigger reload");
    
    Ok(())
}

#[tauri::command]
fn reload_hotkeys_command(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    
    println!("🔄 RELOAD_HOTKEYS_COMMAND CALLED!");
    println!("🔄 Reloading hotkeys...");
    
    match register_hotkeys_dynamically(&app, &state, &broadcast_tx) {
        Ok(_) => {
            println!("✅ RELOAD_HOTKEYS_COMMAND COMPLETED SUCCESSFULLY!");
    Ok(())
        },
        Err(e) => {
            println!("❌ RELOAD_HOTKEYS_COMMAND FAILED: {}", e);
            Err(e)
        }
    }
}

// Function to reload hotkeys dynamically
fn reload_hotkeys() -> Result<(), String> {
    println!("🔄 Attempting to reload hotkeys dynamically...");
    
    // This function will be called from the setup function after we have access to the global shortcut manager
    // For now, we'll return success and let the setup function handle the actual reloading
    Ok(())
}

// Function to register hotkeys dynamically
fn register_hotkeys_dynamically(app_handle: &tauri::AppHandle, state: &SharedWinState, broadcast_tx: &broadcast::Sender<WinState>) -> Result<(), String> {
    println!("🎮 Registering hotkeys dynamically...");
    
    let gs = app_handle.global_shortcut();
    
    // Unregister all existing shortcuts first
    let _ = gs.unregister_all();
    println!("🧹 Cleared existing shortcuts");
    
    // Load custom hotkeys from localStorage
    let custom_hotkeys = load_custom_hotkeys();
    println!("📋 Loaded hotkeys from storage: {:?}", custom_hotkeys);
    
    // Convert custom hotkeys to Tauri format and create Shortcut objects
    let mut tauri_hotkeys = Vec::new();
    let mut hotkey_mapping = std::collections::HashMap::new();
    
    println!("🎹 Processing {} custom hotkeys", custom_hotkeys.len());
    
    for (action, hotkey) in &custom_hotkeys {
        println!("🎹 Processing hotkey: {} -> {}", action, hotkey);
        
        if let Ok(tauri_hotkey) = convert_hotkey_format(hotkey) {
            println!("🎹 Converted to Tauri format: {} -> {}", hotkey, tauri_hotkey);
            
            // Parse the hotkey string into a Shortcut object
            match tauri_hotkey.parse::<tauri_plugin_global_shortcut::Shortcut>() {
                Ok(shortcut) => {
                    tauri_hotkeys.push(shortcut.clone());
                    hotkey_mapping.insert(shortcut.to_string(), action.clone());
                    println!("✅ Successfully prepared hotkey: {} -> {} ({})", action, hotkey, tauri_hotkey);
                }
                Err(e) => {
                    println!("❌ Failed to parse hotkey: {} -> {} (error: {})", action, tauri_hotkey, e);
                }
            }
        } else {
            println!("❌ Failed to convert hotkey format: {} -> {}", action, hotkey);
        }
    }
    
    // If no custom hotkeys loaded, use defaults
    if tauri_hotkeys.is_empty() {
        println!("⚠️ No custom hotkeys found, using defaults");
        let default_hotkeys = vec![
            ("Alt+Equal".to_string(), "increment".to_string()),
            ("Alt+Minus".to_string(), "decrement".to_string()),
            ("Shift+Alt+Equal".to_string(), "increment10".to_string()),
            ("Shift+Alt+Minus".to_string(), "decrement10".to_string())
        ];
        
        for (hotkey, action) in default_hotkeys {
            println!("🎹 Processing default hotkey: {} -> {}", action, hotkey);
            if let Ok(tauri_hotkey) = convert_hotkey_format(&hotkey) {
                println!("🎹 Converted default to Tauri format: {} -> {}", hotkey, tauri_hotkey);
                if let Ok(shortcut) = tauri_hotkey.parse::<tauri_plugin_global_shortcut::Shortcut>() {
                    tauri_hotkeys.push(shortcut.clone());
                    hotkey_mapping.insert(shortcut.to_string(), action.clone());
                    println!("✅ Successfully prepared default hotkey: {} -> {} ({})", action, hotkey, tauri_hotkey);
                } else {
                    println!("❌ Failed to parse default hotkey: {} -> {}", action, tauri_hotkey);
                }
            } else {
                println!("❌ Failed to convert default hotkey format: {} -> {}", action, hotkey);
            }
        }
    }
    
    println!("🎯 Final hotkey mapping: {:?}", hotkey_mapping);
    println!("🎯 Final tauri hotkeys: {:?}", tauri_hotkeys.iter().map(|s| s.to_string()).collect::<Vec<_>>());
    
    // Register all hotkeys with strict key down only filtering
    match gs.on_shortcuts(tauri_hotkeys.clone(), {
        let app_handle = app_handle.clone();
        let state = state.clone();
        let broadcast_tx = broadcast_tx.clone();
        
        move |_app, shortcut, event| {
            let shortcut_str = shortcut.to_string();
            
            // STRICT: Only process KeyDown events, completely ignore KeyUp
            let event_str = format!("{:?}", event);
            if event_str.contains("Up") || event_str.contains("Release") {
                println!("🚫 IGNORING KEY UP: {} (event: {:?})", shortcut_str, event);
                return;
            }
            
            // Only process KeyDown events
            if !event_str.contains("Down") && !event_str.contains("Press") {
                println!("🚫 IGNORING UNKNOWN EVENT: {} (event: {:?})", shortcut_str, event);
                return;
            }
            
            println!("✅ KEY DOWN CONFIRMED: '{}' -> {:?}", shortcut_str, event);
            
            // Find which action this hotkey corresponds to
            if let Some(action) = hotkey_mapping.get(&shortcut_str) {
                println!("🎯 Hotkey '{}' matches action: {}", shortcut_str, action);
                
                // Handle the action with proper state access
                match action.as_str() {
                    "increment" => {
                        println!("⬆️ increase_win (+1) - STRICT KEY DOWN ONLY");
                        change_win(&app_handle, &state, &broadcast_tx, 1);
                    }
                    "decrement" => {
                        println!("⬇️ decrease_win (-1) - STRICT KEY DOWN ONLY");
                        change_win(&app_handle, &state, &broadcast_tx, -1);
                    }
                    "increment10" => {
                        println!("⬆️⬆️ big increase_win (+10) - STRICT KEY DOWN ONLY");
                        change_win_with_step(&app_handle, &state, &broadcast_tx, 1, 10);
                    }
                    "decrement10" => {
                        println!("⬇️⬇️ big decrease_win (-10) - STRICT KEY DOWN ONLY");
                        change_win_with_step(&app_handle, &state, &broadcast_tx, -1, 10);
                    }
                    _ => {
                        println!("❓ Unknown action: {}", action);
                    }
                }
            } else {
                println!("❓ No action found for hotkey: {}", shortcut_str);
            }
        }
    }) {
        Ok(_) => {
            println!("✅ Successfully registered {} hotkeys with strict key down filtering", tauri_hotkeys.len());
            for (i, hotkey) in tauri_hotkeys.iter().enumerate() {
                println!("  {}. {}", i + 1, hotkey.to_string());
            }
            Ok(())
        }
        Err(e) => {
            println!("❌ Failed to register hotkeys: {}", e);
            Err(format!("Failed to register hotkeys: {}", e))
        }
    }
}

// Helper function to convert frontend hotkey format to Tauri format
fn convert_hotkey_format(hotkey: &str) -> Result<String, String> {
    println!("🔄 Converting hotkey format: {}", hotkey);
    
    // Handle single keys first (no modifiers)
    if hotkey.len() == 1 {
        let key = hotkey.to_uppercase();
        // Single keys need to be prefixed with "Key" for Tauri
        return Ok(format!("Key{}", key));
    }
    
    // Handle function keys (F1, F2, etc.)
    if hotkey.starts_with("F") && hotkey.len() > 1 {
        // Function keys are already in correct format
        return Ok(hotkey.to_uppercase());
    }
    
    // Handle special single keys
    let special_keys = [
        ("Enter", "Enter"),
        ("Space", "Space"),
        ("Tab", "Tab"),
        ("Escape", "Escape"),
        ("Backspace", "Backspace"),
        ("Delete", "Delete"),
        ("Home", "Home"),
        ("End", "End"),
        ("PageUp", "PageUp"),
        ("PageDown", "PageDown"),
        ("Insert", "Insert"),
        ("PrintScreen", "PrintScreen"),
        ("ScrollLock", "ScrollLock"),
        ("Pause", "Pause"),
        ("NumLock", "NumLock"),
        ("CapsLock", "CapsLock"),
        ("Equal", "Equal"),
        ("Minus", "Minus"),
    ];
    
    for (original, tauri) in special_keys {
        if hotkey == original {
            return Ok(tauri.to_string());
        }
    }
    
    // Handle modifier combinations (Ctrl+A, Alt+=, etc.)
    let mut converted = hotkey.to_string();
    
    // Replace common modifiers
    converted = converted.replace("Ctrl+", "Control+");
    converted = converted.replace("Alt+", "Alt+");
    converted = converted.replace("Shift+", "Shift+");
    converted = converted.replace("Meta+", "Meta+");
    
    // Handle special keys in combinations (only if they're single characters)
    if converted.contains("=") && !converted.contains("Equal") {
    converted = converted.replace("=", "Equal");
    }
    if converted.contains("-") && !converted.contains("Minus") {
    converted = converted.replace("-", "Minus");
    }
    converted = converted.replace(" ", "Space");
    
    // Convert single letters in combinations to Key format
    let parts: Vec<&str> = converted.split('+').collect();
    if parts.len() > 1 {
        let last_part = parts.last().unwrap();
        if last_part.len() == 1 && last_part.chars().next().unwrap().is_alphabetic() {
            let key_part = format!("Key{}", last_part.to_uppercase());
            let mut new_parts = parts[..parts.len()-1].to_vec();
            new_parts.push(&key_part);
            converted = new_parts.join("+");
        }
    }
    
    println!("🔄 Converted hotkey: {} -> {}", hotkey, converted);
    Ok(converted)
}

// Function to load custom hotkeys from localStorage equivalent
fn load_custom_hotkeys() -> std::collections::HashMap<String, String> {
    println!("🎹 LOAD_CUSTOM_HOTKEYS CALLED!");
    let mut hotkeys = std::collections::HashMap::new();
    
    // Try to load from a file (equivalent to localStorage)
    let hotkey_path = get_app_data_file("win_count_hotkeys.json").unwrap_or_else(|_| {
        println!("❌ Failed to get hotkey file path, using temp directory");
        std::env::temp_dir().join("win_count_hotkeys.json")
    });
    println!("🎹 Checking hotkey file: {:?}", hotkey_path);
    
    if hotkey_path.exists() {
        println!("🎹 Hotkey file exists, attempting to load...");
        if let Ok(hotkey_data) = fs::read_to_string(&hotkey_path) {
            println!("🎹 Hotkey file content: {}", hotkey_data);
            if let Ok(parsed) = serde_json::from_str::<std::collections::HashMap<String, String>>(&hotkey_data) {
                hotkeys = parsed;
                println!("🎹 Loaded custom hotkeys: {:?}", hotkeys);
            } else {
                println!("❌ Failed to parse hotkey file");
            }
        } else {
            println!("❌ Failed to read hotkey file");
        }
    } else {
        println!("🎹 Hotkey file does not exist");
    }
    
    // If no custom hotkeys loaded, try to load from presets
    if hotkeys.is_empty() {
        println!("🎹 No custom hotkeys found, checking presets...");
        let presets_path = get_app_data_file("win_count_presets.json").unwrap_or_else(|_| {
            println!("❌ Failed to get presets file path, using temp directory");
            std::env::temp_dir().join("win_count_presets.json")
        });
        println!("🎹 Checking presets file: {:?}", presets_path);
        
        if presets_path.exists() {
            println!("🎹 Presets file exists, attempting to load...");
            if let Ok(presets_data) = fs::read_to_string(&presets_path) {
                println!("🎹 Presets file content: {}", presets_data);
                if let Ok(presets) = serde_json::from_str::<Vec<PresetData>>(&presets_data) {
                    // Use the first preset's hotkeys
                    if let Some(first_preset) = presets.first() {
                        hotkeys.insert("increment".to_string(), first_preset.hotkeys.increase.clone());
                        hotkeys.insert("decrement".to_string(), first_preset.hotkeys.decrease.clone());
                        hotkeys.insert("increment10".to_string(), format!("Shift+{}", first_preset.hotkeys.increase));
                        hotkeys.insert("decrement10".to_string(), format!("Shift+{}", first_preset.hotkeys.decrease));
                        println!("🎹 Loaded hotkeys from presets: {:?}", hotkeys);
                    } else {
                        println!("❌ No presets found in file");
                    }
                } else {
                    println!("❌ Failed to parse presets file");
                }
            } else {
                println!("❌ Failed to read presets file");
            }
        } else {
            println!("🎹 Presets file does not exist");
        }
    }
    
    // Set defaults if not found - match frontend format
    if hotkeys.is_empty() {
        println!("🎹 No hotkeys found anywhere, using defaults");
        hotkeys.insert("increment".to_string(), "Alt+Equal".to_string());
        hotkeys.insert("decrement".to_string(), "Alt+Minus".to_string());
        hotkeys.insert("increment10".to_string(), "Shift+Alt+Equal".to_string());
        hotkeys.insert("decrement10".to_string(), "Shift+Alt+Minus".to_string());
        println!("🎹 Using default hotkeys: {:?}", hotkeys);
    }
    
    println!("🎹 LOAD_CUSTOM_HOTKEYS COMPLETED: {:?}", hotkeys);
    hotkeys
}

// Function to save custom hotkeys
fn save_custom_hotkeys(hotkeys: &std::collections::HashMap<String, String>) -> Result<(), String> {
    let hotkey_path = get_app_data_file("win_count_hotkeys.json")?;
    let hotkey_json = serde_json::to_string(hotkeys)
        .map_err(|e| format!("Failed to serialize hotkeys: {}", e))?;
    
    fs::write(hotkey_path, hotkey_json)
        .map_err(|e| format!("Failed to save hotkeys: {}", e))
}





// License system removed

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WinState {
    pub win: i32,  // Changed from u32 to i32 to support negative numbers
    pub goal: i32, // Changed from u32 to i32 to support negative goals
    pub show_goal: bool,
    pub show_crown: bool,
    pub current_preset: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetData {
    pub name: String,
    pub win: i32,
    pub goal: i32,
    pub show_goal: bool,
    pub show_crown: bool,
    pub hotkeys: HotkeyConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyConfig {
    pub increase: String,
    pub decrease: String,
    pub step_size: i32,
}

// Struct สำหรับข้อมูล Update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: String,
    pub current_version: String,
    pub body: String,
    pub date: Option<String>,
}

impl Default for WinState {
    fn default() -> Self {
        Self {
            win: 0,
            goal: 10,
            show_goal: true,
            show_crown: true,
            current_preset: "Default".to_string(),
        }
    }
}

impl Default for HotkeyConfig {
    fn default() -> Self {
        Self {
            increase: "Alt+Equal".to_string(),
            decrease: "Alt+Minus".to_string(),
            step_size: 1,
        }
    }
}

type SharedWinState = Arc<Mutex<WinState>>;
type KeyTrackerMap = Arc<Mutex<HashMap<String, KeyEventTracker>>>;

// Add global shortcut manager state
type GlobalShortcutManager = Arc<Mutex<Option<tauri::AppHandle>>>;

fn get_state_path() -> PathBuf {
    std::env::temp_dir().join("win_count_state.json")
}

fn load_state(path: &PathBuf) -> WinState {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_state(path: &PathBuf, state: &WinState) {
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(path, serde_json::to_string_pretty(state).unwrap());
}

#[tauri::command]
fn get_win_state(state: State<'_, SharedWinState>) -> Result<WinState, String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    Ok(state.lock().unwrap().clone())
}

#[tauri::command]
fn set_win_state(new_state: WinState, state: State<'_, SharedWinState>) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    
    let mut s = state.lock().unwrap();
    *s = new_state.clone();
    let path = get_state_path();
    save_state(&path, &new_state);
    Ok(())
}

#[tauri::command]
fn minimize_app(window: tauri::Window) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    
    let _ = window.minimize();
    Ok(())
}

#[tauri::command]
fn hide_to_tray(window: tauri::Window) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    
    println!("🔒 hide_to_tray command called");
    match window.hide() {
        Ok(_) => {
            println!("✅ Window hidden to tray successfully via command");
            Ok(())
        },
        Err(e) => {
            println!("❌ Failed to hide window via command: {:?}", e);
            // Try minimizing as fallback
            match window.minimize() {
                Ok(_) => {
                    println!("✅ Window minimized as fallback via command");
                    Ok(())
                },
                Err(e2) => {
                    let error_msg = format!("Failed to hide or minimize window: {:?}", e2);
                    println!("❌ {}", error_msg);
                    Err(error_msg)
                }
            }
        }
    }
}

#[tauri::command]
fn show_from_tray(window: tauri::Window) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    
    let _ = window.show();
    let _ = window.set_focus();
    Ok(())
}

// Key event tracking for dynamic speed
#[derive(Debug, Clone)]
struct KeyEventTracker {
    last_press_time: Instant,
    press_count: u32,
    last_execution_time: Instant,
    key_down_count: u32,
    equal_presses: u32, // Count = presses while Alt is held
    last_key_state: bool, // Track the last Windows key state
}

impl Default for KeyEventTracker {
    fn default() -> Self {
        Self {
            last_press_time: Instant::now() - Duration::from_secs(1),
            press_count: 0,
            last_execution_time: Instant::now() - Duration::from_secs(1),
            key_down_count: 0,
            equal_presses: 0,
            last_key_state: false,
        }
    }
}

// Windows-specific key state checking
#[cfg(windows)]
unsafe fn is_key_physically_pressed(vk_code: i32) -> bool {
    // GetAsyncKeyState returns the key state
    // The most significant bit indicates if the key is currently pressed
    (GetAsyncKeyState(vk_code) as u16 & 0x8000) != 0
}

#[cfg(not(windows))]
fn is_key_physically_pressed(_vk_code: i32) -> bool {
    false // Fallback for non-Windows platforms
}

// Check if Alt and Equal keys are physically pressed
fn are_hotkeys_alt_equal_pressed() -> (bool, bool) {
    #[cfg(windows)]
    unsafe {
        let alt_pressed = is_key_physically_pressed(VK_MENU);
        let equal_pressed = is_key_physically_pressed(VK_OEM_PLUS); // = key
        (alt_pressed, equal_pressed)
    }
    #[cfg(not(windows))]
    {
        (false, false)
    }
}

// Check if Alt and Minus keys are physically pressed
fn are_hotkeys_alt_minus_pressed() -> (bool, bool) {
    #[cfg(windows)]
    unsafe {
        let alt_pressed = is_key_physically_pressed(VK_MENU);
        let minus_pressed = is_key_physically_pressed(VK_OEM_MINUS); // - key
        (alt_pressed, minus_pressed)
    }
    #[cfg(not(windows))]
    {
        (false, false)
    }
}

// Calculate dynamic step based on press frequency
fn calculate_dynamic_step(tracker: &KeyEventTracker) -> i32 {
    let time_since_last = tracker.last_press_time.elapsed();
    
    // If pressed rapidly (within 300ms), increase step size
    if time_since_last < Duration::from_millis(300) {
        match tracker.press_count {
            1 => 1,          // First press: always step 1
            2..=3 => 1,      // Still slow: normal step
            4..=6 => 2,      // Medium: double step
            7..=10 => 3,     // Fast: 3x step
            11..=15 => 5,    // Very fast: 5x step
            _ => 8,          // Extremely fast: 8x step
        }
    } else {
        // Reset to normal speed if paused
        1
    }
}

// Helper function for win state mutation and event emitting
fn change_win_with_step(app: &tauri::AppHandle, state: &SharedWinState, broadcast_tx: &tokio::sync::broadcast::Sender<WinState>, delta: i32, step: i32) {
    let mut s = state.lock().unwrap();
    let new_win = (s.win + (delta * step)).max(-10000).min(10000);  // Support negative values, match set_win range
    s.win = new_win;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    
    // Auto-save to current preset (same as set_win)
    let current_preset_name = s.current_preset.clone();
    let current_state = s.clone();
    drop(s); // Release lock before calling save_preset
    
    if let Ok(mut presets) = load_presets() {
        if let Some(preset) = presets.iter_mut().find(|p| p.name == current_preset_name) {
            preset.win = current_state.win;
            preset.goal = current_state.goal;
            preset.show_goal = current_state.show_goal;
            preset.show_crown = current_state.show_crown;
            
            // Save updated presets
            let presets_path = get_app_data_file("win_count_presets.json").unwrap_or_else(|_| {
                println!("❌ Failed to get presets file path, using temp directory");
                std::env::temp_dir().join("win_count_presets.json")
            });
            if let Ok(json) = serde_json::to_string_pretty(&presets) {
                let _ = fs::write(&presets_path, json);
                println!("💾 Auto-saved hotkey change to preset: {}", current_preset_name);
            }
        } else {
            println!("⚠️ Preset '{}' not found for auto-save, hotkey change saved to state only", current_preset_name);
            // Try to create the preset if it doesn't exist
            let new_preset = PresetData {
                name: current_preset_name.clone(),
                win: current_state.win,
                goal: current_state.goal,
                show_goal: current_state.show_goal,
                show_crown: current_state.show_crown,
                hotkeys: HotkeyConfig::default(),
            };
            presets.push(new_preset);
            
            // Save updated presets
            let presets_path = get_app_data_file("win_count_presets.json").unwrap_or_else(|_| {
                println!("❌ Failed to get presets file path, using temp directory");
                std::env::temp_dir().join("win_count_presets.json")
            });
            if let Ok(json) = serde_json::to_string_pretty(&presets) {
                let _ = fs::write(&presets_path, json);
                println!("💾 Created and auto-saved to new preset: {}", current_preset_name);
            }
        }
    }
    
    // Emit sound event
    if delta > 0 {
        let _ = app.emit("play-increase-sound", ());
    } else {
        let _ = app.emit("play-decrease-sound", ());
    }
    
    println!("🔥 Win changed by {} (step: {}), new value: {}", delta * step, step, new_win);
}

// Helper function for win state mutation and event emitting
fn change_win(app: &tauri::AppHandle, state: &SharedWinState, broadcast_tx: &tokio::sync::broadcast::Sender<WinState>, delta: i32) {
    change_win_with_step(app, state, broadcast_tx, delta, 1);
}

#[tauri::command]
fn increase_win(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    change_win(&app, &state, &*broadcast_tx, 1);
    Ok(())
}

#[tauri::command]
fn decrease_win(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    change_win(&app, &state, &*broadcast_tx, -1);
    Ok(())
}

#[tauri::command]
fn increase_win_by_step(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>, step: i32) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    change_win_with_step(&app, &state, &*broadcast_tx, 1, step);
    Ok(())
}

#[tauri::command]
fn decrease_win_by_step(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>, step: i32) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    change_win_with_step(&app, &state, &*broadcast_tx, -1, step);
    Ok(())
}

#[tauri::command]
fn set_win(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>, value: i32) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    
    let mut s = state.lock().unwrap();
    // Clamp value between -10000 and 10000
    let new_win = value.max(-10000).min(10000);
    s.win = new_win;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    
    // Auto-save to current preset
    let current_preset_name = s.current_preset.clone();
    let current_state = s.clone();
    drop(s); // Release lock before calling save_preset
    
    if let Ok(mut presets) = load_presets() {
        if let Some(preset) = presets.iter_mut().find(|p| p.name == current_preset_name) {
            preset.win = current_state.win;
            preset.goal = current_state.goal;
            preset.show_goal = current_state.show_goal;
            preset.show_crown = current_state.show_crown;
            
            // Save updated presets
            let presets_path = get_app_data_file("win_count_presets.json").unwrap_or_else(|_| {
                println!("❌ Failed to get presets file path, using temp directory");
                std::env::temp_dir().join("win_count_presets.json")
            });
            if let Ok(json) = serde_json::to_string_pretty(&presets) {
                let _ = fs::write(&presets_path, json);
                println!("💾 Auto-saved to preset: {}", current_preset_name);
            }
        }
    }
    
    println!("🎯 Win set to: {}", new_win);
    Ok(())
}

#[tauri::command]
fn set_goal(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>, value: i32) -> Result<(), String> {
    if !x7y9z2() {
        return Err("UNAUTHORIZED_ACCESS".to_string());
    }
    
    let mut s = state.lock().unwrap();
    // Clamp value between -10000 and 10000  
    let new_goal = value.max(-10000).min(10000);
    s.goal = new_goal;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    
    // Auto-save to current preset
    let current_preset_name = s.current_preset.clone();
    let current_state = s.clone();
    drop(s); // Release lock before calling save_preset
    
    if let Ok(mut presets) = load_presets() {
        if let Some(preset) = presets.iter_mut().find(|p| p.name == current_preset_name) {
            preset.win = current_state.win;
            preset.goal = current_state.goal;
            preset.show_goal = current_state.show_goal;
            preset.show_crown = current_state.show_crown;
            
            // Save updated presets
            let presets_path = get_app_data_file("win_count_presets.json").unwrap_or_else(|_| {
                println!("❌ Failed to get presets file path, using temp directory");
                std::env::temp_dir().join("win_count_presets.json")
            });
            if let Ok(json) = serde_json::to_string_pretty(&presets) {
                let _ = fs::write(&presets_path, json);
                println!("💾 Auto-saved to preset: {}", current_preset_name);
            }
        }
    }
    
    println!("🎯 Goal set to: {}", new_goal);
    Ok(())
}

#[tauri::command]
fn toggle_goal_visibility(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let mut s = state.lock().unwrap();
    s.show_goal = !s.show_goal;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    println!("🎯 Goal visibility toggled to: {}", s.show_goal);
    Ok(())
}

#[tauri::command]
fn toggle_crown_visibility(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let mut s = state.lock().unwrap();
    s.show_crown = !s.show_crown;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    println!("👑 Crown visibility toggled to: {}", s.show_crown);
    Ok(())
}

#[tauri::command]
async fn copy_overlay_link() -> Result<String, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    use std::process::Command;
    let overlay_url = "http://localhost:1420/overlay";
    
    // Use Windows clipboard command  
    #[cfg(windows)]
    {
        let output = Command::new("cmd")
            .args(&["/C", &format!("echo {} | clip", overlay_url)])
            .output()
            .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
            
        if output.status.success() {
            println!("📋 Copied overlay link to clipboard: {}", overlay_url);
            Ok(overlay_url.to_string())
        } else {
            Err("Failed to copy overlay link to clipboard".to_string())
        }
    }
    
    #[cfg(not(windows))]
    {
        // For non-Windows systems, just return the URL
        println!("📋 Overlay link: {}", overlay_url);
        Ok(overlay_url.to_string())
    }    
}

#[tauri::command]
fn save_preset(preset: PresetData, state: State<'_, SharedWinState>) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let presets_path = get_app_data_file("win_count_presets.json")?;
    
    println!("🔴 Attempting to save preset: {:?}", preset);
    
    // Load existing presets
    let mut presets: Vec<PresetData> = if presets_path.exists() {
        let json = fs::read_to_string(&presets_path)
            .map_err(|e| format!("Failed to read presets: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to parse presets: {}", e))?
    } else {
        Vec::new()
    };
    
    // Remove existing preset with same name
    presets.retain(|p| p.name != preset.name);
    
    // Add new preset
    presets.push(preset.clone());
    
    // Limit to 10 presets
    if presets.len() > 10 {
        presets.remove(0);
    }
    
    // Save presets
    let json = serde_json::to_string_pretty(&presets)
        .map_err(|e| format!("Failed to serialize presets: {}", e))?;
    fs::write(&presets_path, &json)
        .map_err(|e| format!("Failed to save presets: {}", e))?;
    
    // Update current state if this is the active preset
    let mut s = state.lock().unwrap();
    if s.current_preset == preset.name {
        s.win = preset.win;
        s.goal = preset.goal;
        s.show_goal = preset.show_goal;
        s.show_crown = preset.show_crown;
    }
    
    println!("💾 Saved preset: {} | Win: {} | Goal: {}", preset.name, preset.win, preset.goal);
    Ok(())
}

#[tauri::command]
fn load_presets() -> Result<Vec<PresetData>, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let presets_path = get_app_data_file("win_count_presets.json")?;
    
    println!("📋 Loading presets from: {:?}", presets_path);
    
    let mut presets: Vec<PresetData> = if presets_path.exists() {
        let json = fs::read_to_string(&presets_path)
            .map_err(|e| format!("Failed to read presets: {}", e))?;
        
        println!("📄 Presets JSON: {}", json);
        
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to parse presets: {}", e))?
    } else {
        Vec::new()
    };
    
    // Ensure Default preset exists (only if no presets exist)
    if presets.is_empty() {
        let default_preset = PresetData {
            name: "Default".to_string(),
            win: 0,
            goal: 10,
            show_goal: true,
            show_crown: true,
            hotkeys: HotkeyConfig::default(),
        };
        presets.insert(0, default_preset);
        
        // Save updated presets
        let json = serde_json::to_string_pretty(&presets)
            .map_err(|e| format!("Failed to serialize presets: {}", e))?;
        fs::write(&presets_path, json)
            .map_err(|e| format!("Failed to save presets: {}", e))?;
        println!("🔄 Created Default preset because no presets existed");
    }
    
    println!("✅ Loaded {} presets", presets.len());
    Ok(presets)
}

#[tauri::command]
fn load_preset(name: String, app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) -> Result<PresetData, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("🔍 Attempting to load preset: {}", name);
    
    let presets = load_presets()?;
    let preset = presets.into_iter()
        .find(|p| p.name == name)
        .ok_or_else(|| format!("Preset '{}' not found", name))?;
    
    println!("📂 Found preset: {} | Win: {} | Goal: {}", preset.name, preset.win, preset.goal);
    
    // Update state
    let mut s = state.lock().unwrap();
    s.win = preset.win;
    s.goal = preset.goal;
    s.show_goal = preset.show_goal;
    s.show_crown = preset.show_crown;
    s.current_preset = preset.name.clone();
    
    // Save state and broadcast
    let path = get_state_path();
    save_state(&path, &s);
    let _ = app.emit("state-updated", s.clone());
    let _ = broadcast_tx.send(s.clone());
    
    // Sync hotkeys with preset
    let mut hotkeys = std::collections::HashMap::new();
    hotkeys.insert("increment".to_string(), preset.hotkeys.increase.clone());
    hotkeys.insert("decrement".to_string(), preset.hotkeys.decrease.clone());
    hotkeys.insert("increment10".to_string(), format!("Shift+{}", preset.hotkeys.increase));
    hotkeys.insert("decrement10".to_string(), format!("Shift+{}", preset.hotkeys.decrease));
    
    // Save hotkeys to sync with preset
    if let Err(e) = save_custom_hotkeys(&hotkeys) {
        println!("⚠️ Failed to save hotkeys for preset: {}", e);
    } else {
        println!("🎹 Synced hotkeys with preset: {:?}", hotkeys);
        
        // Reload hotkeys to make them active immediately
        if let Err(e) = register_hotkeys_dynamically(&app, &state, &broadcast_tx) {
            println!("⚠️ Failed to reload hotkeys after preset sync: {}", e);
        } else {
            println!("✅ Hotkeys reloaded after preset sync");
        }
    }
    
    println!("✅ Loaded preset: {} | Updated Win: {} | Updated Goal: {}", name, s.win, s.goal);
    Ok(preset)
}

#[tauri::command]
fn delete_preset(name: String) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("🗑️ DELETE_PRESET CALLED with name: {}", name);
    let presets_path = get_app_data_file("win_count_presets.json")?;
    println!("📁 Presets path: {:?}", presets_path);
    
    if !presets_path.exists() {
        println!("⚠️ Presets file does not exist, returning OK");
        return Ok(());
    }
    
    let json = fs::read_to_string(&presets_path)
        .map_err(|e| format!("Failed to read presets: {}", e))?;
    println!("📄 Read presets JSON: {}", json);
    
    let mut presets: Vec<PresetData> = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse presets: {}", e))?;
    println!("📋 Parsed presets: {:?}", presets.iter().map(|p| &p.name).collect::<Vec<_>>());
    
    // ตรวจสอบว่ามี preset ที่ต้องการลบอยู่จริงหรือไม่
    if !presets.iter().any(|p| p.name == name) {
        println!("❌ Preset '{}' not found in list", name);
        return Err(format!("Preset '{}' not found", name));
    }
    
    println!("✅ Found preset '{}' to delete", name);
    
    // ลบ preset ที่ต้องการ
    let original_count = presets.len();
    presets.retain(|p| p.name != name);
    let new_count = presets.len();
    println!("🔄 Removed {} preset(s), count: {} -> {}", original_count - new_count, original_count, new_count);
    
    // ถ้าลบ preset สุดท้าย ให้สร้าง Default preset ใหม่
    if presets.is_empty() {
        let default_preset = PresetData {
            name: "Default".to_string(),
            win: 0,
            goal: 10,
            show_goal: true,
            show_crown: true,
            hotkeys: HotkeyConfig::default(),
        };
        presets.push(default_preset);
        println!("🔄 Created new Default preset after deletion");
    }
    
    let json = serde_json::to_string_pretty(&presets)
        .map_err(|e| format!("Failed to serialize presets: {}", e))?;
    println!("💾 Saving presets JSON: {}", json);
    
    fs::write(&presets_path, json)
        .map_err(|e| format!("Failed to save presets: {}", e))?;
    
    println!("✅ Successfully deleted preset: {}", name);
    Ok(())
}

#[tauri::command]
fn rename_preset(old_name: String, new_name: String) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let presets_path = get_app_data_file("win_count_presets.json")?;
    
    if !presets_path.exists() {
        return Err("No presets file found".to_string());
    }
    
    let json = fs::read_to_string(&presets_path)
        .map_err(|e| format!("Failed to read presets: {}", e))?;
    let mut presets: Vec<PresetData> = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse presets: {}", e))?;
    
    // หา preset ที่ต้องการเปลี่ยนชื่อ
    if let Some(preset) = presets.iter_mut().find(|p| p.name == old_name) {
        preset.name = new_name.clone();
        
        let json = serde_json::to_string_pretty(&presets)
            .map_err(|e| format!("Failed to serialize presets: {}", e))?;
        fs::write(&presets_path, json)
            .map_err(|e| format!("Failed to save presets: {}", e))?;
        
        println!("🔄 Renamed preset from '{}' to '{}'", old_name, new_name);
        Ok(())
    } else {
        Err(format!("Preset '{}' not found", old_name))
    }
}

#[tauri::command]
fn play_test_sounds(app: tauri::AppHandle) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    // Emit events for the frontend to play sounds
    let _ = app.emit("play-increase-sound", {});
    
    // Schedule the decrease sound after a short delay
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(200));
        let _ = app.emit("play-decrease-sound", {});
    });
    
    println!("🔊 Test sounds requested");
    Ok(())
}

#[tauri::command]
fn test_hotkeys() -> Result<String, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("🧪 Testing hotkeys...");
    
    // Load current hotkeys
    let custom_hotkeys = load_custom_hotkeys();
    println!("📋 Current hotkeys: {:?}", custom_hotkeys);
    
    // Test conversion for each hotkey
    let mut conversion_results = Vec::new();
    for (action, hotkey) in &custom_hotkeys {
        match convert_hotkey_format(hotkey) {
            Ok(converted) => {
                conversion_results.push(format!("{} -> {} -> {}", action, hotkey, converted));
                println!("✅ Conversion: {} -> {} -> {}", action, hotkey, converted);
            },
            Err(e) => {
                conversion_results.push(format!("{} -> {} -> ERROR: {}", action, hotkey, e));
                println!("❌ Conversion failed: {} -> {} -> {}", action, hotkey, e);
            }
        }
    }
    
    let result = format!(
        "Hotkeys loaded: {:?}\nConversions:\n{}", 
        custom_hotkeys, 
        conversion_results.join("\n")
    );
    
    Ok(result)
}

#[tauri::command]
fn clear_hotkeys() -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("🧹 CLEAR_HOTKEYS COMMAND CALLED!");
    println!("🧹 Clearing hotkeys...");

    // Delete the hotkey file to force defaults
    let hotkey_path = get_app_data_file("win_count_hotkeys.json")?;
    println!("🧹 Hotkey file path: {:?}", hotkey_path);
    
    if hotkey_path.exists() {
        println!("🧹 Hotkey file exists, attempting to delete...");
        match fs::remove_file(&hotkey_path) {
            Ok(_) => println!("✅ Hotkey file deleted successfully"),
            Err(e) => println!("⚠️ Failed to delete hotkey file: {}", e),
        }
    } else {
        println!("ℹ️ Hotkey file does not exist, already using defaults");
    }

    println!("🧹 CLEAR_HOTKEYS COMMAND COMPLETED!");
    Ok(())
}

#[tauri::command]
fn save_default_hotkeys() -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("💾 SAVE_DEFAULT_HOTKEYS COMMAND CALLED!");
    
    // Create default hotkeys HashMap
    let mut default_hotkeys = std::collections::HashMap::new();
    default_hotkeys.insert("increment".to_string(), "Alt+Equal".to_string());
    default_hotkeys.insert("decrement".to_string(), "Alt+Minus".to_string());
    default_hotkeys.insert("increment10".to_string(), "Shift+Alt+Equal".to_string());
    default_hotkeys.insert("decrement10".to_string(), "Shift+Alt+Minus".to_string());
    
    println!("💾 Saving default hotkeys: {:?}", default_hotkeys);
    
    // Save to file
    match save_custom_hotkeys(&default_hotkeys) {
        Ok(_) => {
            println!("✅ Default hotkeys saved successfully");
            Ok(())
        },
        Err(e) => {
            println!("❌ Failed to save default hotkeys: {}", e);
            Err(e)
        }
    }
}

#[tauri::command]
fn check_hotkey_file() -> Result<String, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("🔍 Checking hotkey file...");
    
    let hotkey_path = get_app_data_file("win_count_hotkeys.json")?;
    let path_str = hotkey_path.to_string_lossy().to_string();
    
    if hotkey_path.exists() {
        match fs::read_to_string(&hotkey_path) {
            Ok(content) => {
                println!("📄 Hotkey file exists with content: {}", content);
                Ok(format!("File exists: {}\nContent: {}", path_str, content))
            },
            Err(e) => {
                println!("❌ Failed to read hotkey file: {}", e);
                Ok(format!("File exists but unreadable: {}\nError: {}", path_str, e))
            }
        }
    } else {
        println!("ℹ️ Hotkey file does not exist");
        Ok(format!("File does not exist: {}", path_str))
    }
}

// Sound file management functions
#[tauri::command]
fn save_custom_sound(file_data: Vec<u8>, filename: String, sound_type: String) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let app_data_dir = get_app_data_dir()?;
    let sounds_dir = app_data_dir.join("sounds");
    
    // Create sounds directory if it doesn't exist
    if !sounds_dir.exists() {
        fs::create_dir_all(&sounds_dir)
            .map_err(|e| format!("Failed to create sounds directory: {}", e))?;
    }
    
    let file_path = sounds_dir.join(&filename);
    fs::write(&file_path, file_data)
        .map_err(|e| format!("Failed to save sound file: {}", e))?;
    
    // Save metadata
    let metadata = serde_json::json!({
        "filename": filename,
        "type": sound_type,
        "saved_at": chrono::Utc::now().to_rfc3339()
    });
    
    let metadata_path = app_data_dir.join(format!("sound_{}_metadata.json", sound_type));
    fs::write(metadata_path, serde_json::to_string(&metadata).unwrap())
        .map_err(|e| format!("Failed to save sound metadata: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn get_custom_sound_path(sound_type: String) -> Result<String, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let app_data_dir = get_app_data_dir()?;
    let metadata_path = app_data_dir.join(format!("sound_{}_metadata.json", sound_type));
    
    if metadata_path.exists() {
        let metadata_str = fs::read_to_string(metadata_path)
            .map_err(|_| "Failed to read sound metadata".to_string())?;
        
        let metadata: serde_json::Value = serde_json::from_str(&metadata_str)
            .map_err(|_| "Invalid sound metadata format".to_string())?;
        
        let filename = metadata["filename"].as_str()
            .ok_or("Invalid filename in metadata".to_string())?;
        
        let sound_path = app_data_dir.join("sounds").join(filename);
        if sound_path.exists() {
            Ok(sound_path.to_string_lossy().to_string())
        } else {
            Err("Sound file not found".to_string())
        }
    } else {
        Err("No custom sound metadata found".to_string())
    }
}

#[tauri::command]
fn delete_custom_sound(sound_type: String) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let app_data_dir = get_app_data_dir()?;
    let metadata_path = app_data_dir.join(format!("sound_{}_metadata.json", sound_type));
    
    if metadata_path.exists() {
        let metadata_str = fs::read_to_string(&metadata_path)
            .map_err(|_| "Failed to read sound metadata".to_string())?;
        
        let metadata: serde_json::Value = serde_json::from_str(&metadata_str)
            .map_err(|_| "Invalid sound metadata format".to_string())?;
        
        let filename = metadata["filename"].as_str()
            .ok_or("Invalid filename in metadata".to_string())?;
        
        // Delete sound file
        let sound_path = app_data_dir.join("sounds").join(filename);
        if sound_path.exists() {
            fs::remove_file(&sound_path)
                .map_err(|e| format!("Failed to delete sound file: {}", e))?;
        }
        
        // Delete metadata
        fs::remove_file(metadata_path)
            .map_err(|e| format!("Failed to delete sound metadata: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
fn read_sound_file(file_path: String) -> Result<Vec<u8>, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    fs::read(&file_path)
        .map_err(|e| format!("Failed to read sound file: {}", e))
}

#[tauri::command]
fn get_custom_sound_filename(sound_type: String) -> Result<String, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    let app_data_dir = get_app_data_dir()?;
    let metadata_path = app_data_dir.join(format!("sound_{}_metadata.json", sound_type));
    
    if metadata_path.exists() {
        let metadata_str = fs::read_to_string(metadata_path)
            .map_err(|_| "Failed to read sound metadata".to_string())?;
        
        let metadata: serde_json::Value = serde_json::from_str(&metadata_str)
            .map_err(|_| "Invalid sound metadata format".to_string())?;
        
        let filename = metadata["filename"].as_str()
            .ok_or("Invalid filename in metadata".to_string())?;
        
        Ok(filename.to_string())
    } else {
        Err("No custom sound metadata found".to_string())
    }
}

// Auto-Update Commands
#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("🔄 Checking for updates...");
    
    use tauri_plugin_updater::UpdaterExt;
    
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(update) => {
                    if let Some(update) = update {
                        println!("🎉 Update available: {}", update.version);
                        
                        let update_info = UpdateInfo {
                            available: true,
                            version: update.version.clone(),
                            current_version: app.package_info().version.to_string(),
                            body: update.body.clone().unwrap_or_default(),
                            date: update.date.map(|d| d.to_string()),
                        };
                        
                        // Emit event ให้ frontend
                        let _ = app.emit("update-available", &update_info);
                        
                        Ok(update_info)
                    } else {
                        println!("✅ No updates available");
                        Ok(UpdateInfo {
                            available: false,
                            version: app.package_info().version.to_string(),
                            current_version: app.package_info().version.to_string(),
                            body: "You are using the latest version".to_string(),
                            date: None,
                        })
                    }
                }
                Err(e) => {
                    println!("❌ Failed to check for updates: {}", e);
                    Err(format!("Failed to check for updates: {}", e))
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to get updater: {}", e);
            Err(format!("Updater not available: {}", e))
        }
    }
}

#[tauri::command]
async fn download_and_install_update(app: tauri::AppHandle) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("📥 Starting update download and installation...");
    
    use tauri_plugin_updater::UpdaterExt;
    
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    println!("📦 Downloading update: {}", update.version);
                    
                    // Emit download started event
                    let _ = app.emit("update-download-started", ());
                    
                    // Download และ install
                    match update.download_and_install(
                        |chunk_length, content_length| {
                            // Progress callback
                            let progress = if let Some(total) = content_length {
                                (chunk_length as f32 / total as f32 * 100.0) as u32
                            } else {
                                0
                            };
                            
                            let _ = app.emit("update-download-progress", progress);
                            println!("📥 Download progress: {}%", progress);
                        },
                        || {
                            // Download finished callback
                            let _ = app.emit("update-download-finished", ());
                            println!("✅ Download completed, installing...");
                        }
                    ).await {
                        Ok(_) => {
                            println!("✅ Update installed successfully, restarting...");
                            let _ = app.emit("update-installed", ());
                            
                            // Restart แอป
                            app.restart();
                            Ok(())
                        }
                        Err(e) => {
                            println!("❌ Failed to download/install update: {}", e);
                            let _ = app.emit("update-error", format!("Failed to install: {}", e));
                            Err(format!("Failed to download/install update: {}", e))
                        }
                    }
                }
                Ok(None) => {
                    Err("No updates available".to_string())
                }
                Err(e) => {
                    println!("❌ Failed to check for updates: {}", e);
                    Err(format!("Failed to check for updates: {}", e))
                }
            }
        }
        Err(e) => {
            println!("❌ Failed to get updater: {}", e);
            Err(format!("Updater not available: {}", e))
        }
    }
}

#[tauri::command]
async fn install_update_and_restart(app: tauri::AppHandle) -> Result<(), String> {
    if !x7y9z2() {
        return Err("License not valid".to_string());
    }
    
    println!("🔄 Installing update and restarting...");
    
    // ฟังก์ชันนี้จะถูกเรียกหลังจากที่ download เสร็จแล้ว
    // ใน Tauri v2 การ install จะทำอัตโนมัติใน download_and_install
    app.restart();
    Ok(())
}

// License system removed

fn start_http_server() {
    thread::spawn(move || {
        let rt = Runtime::new().unwrap();
        rt.block_on(async move {
            use tokio::net::TcpListener;
            use tokio::io::{AsyncReadExt, AsyncWriteExt};
            
            println!("🌐 Starting HTTP server on 127.0.0.1:777");
            
            // Debug: Print current working directory
            if let Ok(current_dir) = std::env::current_dir() {
                println!("📁 Current working directory: {:?}", current_dir);
            }
            
            // Debug: Print executable path
            if let Ok(exe_path) = std::env::current_exe() {
                println!("📁 Executable path: {:?}", exe_path);
                if let Some(exe_dir) = exe_path.parent() {
                    println!("📁 Executable directory: {:?}", exe_dir);
                }
            }
            
            // Debug: Check if static folder exists (simplified)
            let static_paths = vec![
                "../static",  // Development path
                "static"      // Fallback path
            ];
            
            let mut static_found = false;
            for path in &static_paths {
                if std::path::Path::new(path).exists() {
                    println!("✅ Static folder found at: {}", path);
                    static_found = true;
                    if let Ok(entries) = std::fs::read_dir(path) {
                        for entry in entries {
                            if let Ok(entry) = entry {
                                println!("   📄 {:?}", entry.file_name());
                            }
                        }
                    }
                    break; // Found the static folder, no need to check others
                }
            }
            
            if !static_found {
                println!("⚠️  Static folder not found in common locations");
            }
            
            // MSI installation paths check (simplified)
            let msi_paths = vec![
                "C:\\Program Files\\Win Count by ArtYWoof\\resources\\static",
                "C:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static"
            ];
            
            let mut msi_found = false;
            for path in &msi_paths {
                if std::path::Path::new(path).exists() {
                    println!("✅ MSI path found: {}", path);
                    msi_found = true;
                    if let Ok(entries) = std::fs::read_dir(path) {
                        for entry in entries {
                            if let Ok(entry) = entry {
                                println!("   📄 {:?}", entry.file_name());
                            }
                        }
                    }
                    break; // Found MSI path, no need to check others
                }
            }
            
            if !msi_found {
                println!("ℹ️  MSI installation not found (normal for development)");
            }
            
            let listener = TcpListener::bind("127.0.0.1:777").await.unwrap();
            
            loop {
                match listener.accept().await {
                    Ok((mut stream, addr)) => {
                        println!("📄 HTTP connection from: {}", addr);
                        
                        tokio::spawn(async move {
                            let mut buffer = [0; 1024];
                            match stream.read(&mut buffer).await {
                                Ok(n) => {
                                    let request = String::from_utf8_lossy(&buffer[..n]);
                                    
                                    if request.starts_with("GET /overlay.html") {
                                        println!("📄 Serving overlay.html");
                                        
                                        // Read overlay.html file - try multiple paths
                                        let overlay_paths = vec![
                                            "../static/overlay.html",
                                            "static/overlay.html",
                                            "./static/overlay.html",
                                            "../../static/overlay.html",
                                            "resources/static/overlay.html",  // For MSI installed version
                                            "C:\\Program Files\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "C:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "C:\\Program Files\\Win Count by ArtYWoof\\static\\overlay.html",
                                            "C:\\Program Files (x86)\\Win Count by ArtYWoof\\static\\overlay.html",
                                            "C:\\Program Files\\Win Count by ArtYWoof\\_up_\\static\\overlay.html",
                                            "C:\\Program Files (x86)\\Win Count by ArtYWoof\\_up_\\static\\overlay.html",
                                            "C:\\Program Files\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "C:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "D:\\Program Files\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "D:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "D:\\Program Files\\Win Count by ArtYWoof\\static\\overlay.html",
                                            "D:\\Program Files (x86)\\Win Count by ArtYWoof\\static\\overlay.html",
                                            "E:\\Program Files\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "E:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "E:\\Program Files\\Win Count by ArtYWoof\\static\\overlay.html",
                                            "E:\\Program Files (x86)\\Win Count by ArtYWoof\\static\\overlay.html",
                                            "F:\\Program Files\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "F:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static\\overlay.html",
                                            "F:\\Program Files\\Win Count by ArtYWoof\\static\\overlay.html",
                                            "F:\\Program Files (x86)\\Win Count by ArtYWoof\\static\\overlay.html",
                                            // Add paths for executable directory
                                            "C:\\Program Files\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static\\overlay.html",
                                            "C:\\Program Files (x86)\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static\\overlay.html",
                                            "D:\\Program Files\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static\\overlay.html",
                                            "D:\\Program Files (x86)\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static\\overlay.html",
                                            "E:\\Program Files\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static\\overlay.html",
                                            "E:\\Program Files (x86)\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static\\overlay.html",
                                            "F:\\Program Files\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static\\overlay.html",
                                            "F:\\Program Files (x86)\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static\\overlay.html"
                                        ];
                                        
                                        println!("🔍 Searching for overlay.html in paths:");
                                        for path in &overlay_paths {
                                            println!("   📂 {}", path);
                                        }
                                        
                                        let mut overlay_content = None;
                                        for path in overlay_paths {
                                            match std::fs::read_to_string(&path) {
                                            Ok(content) => {
                                                    println!("✅ Found overlay.html at: {}", path);
                                                    println!("   📏 File size: {} bytes", content.len());
                                                    overlay_content = Some(content);
                                                    break;
                                                }
                                                Err(e) => {
                                                    println!("❌ Failed to read overlay.html from {}: {}", path, e);
                                                }
                                            }
                                        }
                                        
                                        match overlay_content {
                                            Some(content) => {
                                                let response = format!(
                                                    "HTTP/1.1 200 OK\r\n\
                                                    Content-Type: text/html; charset=utf-8\r\n\
                                                    Content-Length: {}\r\n\
                                                    Access-Control-Allow-Origin: *\r\n\
                                                    Connection: close\r\n\
                                                    \r\n\
                                                    {}",
                                                    content.len(),
                                                    content
                                                );
                                                
                                                if let Err(e) = stream.write_all(response.as_bytes()).await {
                                                    println!("❌ Failed to send HTTP response: {}", e);
                                                }
                                            }
                                            None => {
                                                println!("❌ Failed to read overlay.html from any path");
                                                let response = "HTTP/1.1 404 Not Found\r\n\r\n404 - File not found";
                                                let _ = stream.write_all(response.as_bytes()).await;
                                            }
                                        }
                                    } else if request.starts_with("GET /assets/") {
                                        // Handle static assets (images, fonts, etc.)
                                        let path_start = request.find("GET ").unwrap() + 4;
                                        let path_end = request.find(" HTTP").unwrap();
                                        let asset_path = &request[path_start..path_end];
                                        
                                        // Try multiple paths for assets
                                        let asset_paths = vec![
                                            format!("../static{}", asset_path),
                                            format!("static{}", asset_path),
                                            format!("./static{}", asset_path),
                                            format!("../../static{}", asset_path),
                                            format!("resources/static{}", asset_path),  // For MSI installed version
                                            format!("C:\\Program Files\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("C:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("C:\\Program Files\\Win Count by ArtYWoof\\static{}", asset_path),
                                            format!("C:\\Program Files (x86)\\Win Count by ArtYWoof\\static{}", asset_path),
                                            format!("C:\\Program Files\\Win Count by ArtYWoof\\_up_\\static{}", asset_path),
                                            format!("C:\\Program Files (x86)\\Win Count by ArtYWoof\\_up_\\static{}", asset_path),
                                            format!("C:\\Program Files\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("C:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("D:\\Program Files\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("D:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("D:\\Program Files\\Win Count by ArtYWoof\\static{}", asset_path),
                                            format!("D:\\Program Files (x86)\\Win Count by ArtYWoof\\static{}", asset_path),
                                            format!("E:\\Program Files\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("E:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("E:\\Program Files\\Win Count by ArtYWoof\\static{}", asset_path),
                                            format!("E:\\Program Files (x86)\\Win Count by ArtYWoof\\static{}", asset_path),
                                            format!("F:\\Program Files\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("F:\\Program Files (x86)\\Win Count by ArtYWoof\\resources\\static{}", asset_path),
                                            format!("F:\\Program Files\\Win Count by ArtYWoof\\static{}", asset_path),
                                            format!("F:\\Program Files (x86)\\Win Count by ArtYWoof\\static{}", asset_path),
                                            // Add paths for executable directory
                                            format!("C:\\Program Files\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static{}", asset_path),
                                            format!("C:\\Program Files (x86)\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static{}", asset_path),
                                            format!("D:\\Program Files\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static{}", asset_path),
                                            format!("D:\\Program Files (x86)\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static{}", asset_path),
                                            format!("E:\\Program Files\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static{}", asset_path),
                                            format!("E:\\Program Files (x86)\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static{}", asset_path),
                                            format!("F:\\Program Files\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static{}", asset_path),
                                            format!("F:\\Program Files (x86)\\Win Count by ArtYWoof\\win-count-by-artywoof.exe\\static{}", asset_path)
                                        ];
                                        
                                        println!("🔍 Searching for asset '{}' in paths:", asset_path);
                                        for path in &asset_paths {
                                            println!("   📂 {}", path);
                                        }
                                        
                                        let mut asset_content = None;
                                        
                                        for path in asset_paths {
                                            match std::fs::read(&path) {
                                            Ok(content) => {
                                                    println!("✅ Found asset at: {}", path);
                                                    println!("   📏 File size: {} bytes", content.len());
                                                    asset_content = Some(content);
                                                    break;
                                                }
                                                Err(e) => {
                                                    println!("❌ Failed to read asset from {}: {}", path, e);
                                                }
                                            }
                                        }
                                        
                                        match asset_content {
                                            Some(content) => {
                                                let content_type = if asset_path.ends_with(".png") {
                                                    "image/png"
                                                } else if asset_path.ends_with(".jpg") || asset_path.ends_with(".jpeg") {
                                                    "image/jpeg"
                                                } else if asset_path.ends_with(".svg") {
                                                    "image/svg+xml"
                                                } else if asset_path.ends_with(".css") {
                                                    "text/css"
                                                } else if asset_path.ends_with(".js") {
                                                    "application/javascript"
                                                } else if asset_path.ends_with(".ttf") {
                                                    "font/ttf"
                                                } else if asset_path.ends_with(".woff") {
                                                    "font/woff"
                                                } else if asset_path.ends_with(".woff2") {
                                                    "font/woff2"
                                                } else {
                                                    "application/octet-stream"
                                                };
                                                
                                                let response = format!(
                                                    "HTTP/1.1 200 OK\r\n\
                                                    Content-Type: {}\r\n\
                                                    Content-Length: {}\r\n\
                                                    Access-Control-Allow-Origin: *\r\n\
                                                    Connection: close\r\n\
                                                    \r\n",
                                                    content_type,
                                                    content.len()
                                                );
                                                
                                                if let Err(e) = stream.write_all(response.as_bytes()).await {
                                                    println!("❌ Failed to send HTTP response header: {}", e);
                                                } else if let Err(e) = stream.write_all(&content).await {
                                                    println!("❌ Failed to send HTTP response body: {}", e);
                                                }
                                            }
                                            None => {
                                                println!("❌ Failed to read asset from any path: {}", asset_path);
                                                let response = "HTTP/1.1 404 Not Found\r\n\r\n404 - Asset not found";
                                                let _ = stream.write_all(response.as_bytes()).await;
                                            }
                                        }
                                    } else if request.starts_with("GET /") {
                                        // Redirect root to overlay.html
                                        let response = "HTTP/1.1 302 Found\r\nLocation: /overlay.html\r\nConnection: close\r\n\r\n";
                                        let _ = stream.write_all(response.as_bytes()).await;
                                    } else {
                                        let response = "HTTP/1.1 404 Not Found\r\n\r\n404 - Not found";
                                        let _ = stream.write_all(response.as_bytes()).await;
                                    }
                                }
                                Err(e) => {
                                    println!("❌ Failed to read HTTP request: {}", e);
                                }
                            }
                        });
                    }
                    Err(e) => {
                        println!("❌ Failed to accept HTTP connection: {}", e);
                    }
                }
            }
        });
    });
}

fn start_ws_server(shared_state: Arc<Mutex<WinState>>, broadcast_tx: broadcast::Sender<WinState>) {
    thread::spawn(move || {
        let rt = Runtime::new().unwrap();
        rt.block_on(async move {
            use tokio::net::TcpListener;
            println!("🌐 Starting WebSocket server on 127.0.0.1:779");
            let listener = TcpListener::bind("127.0.0.1:779").await.unwrap();
            
            loop {
                match listener.accept().await {
                    Ok((stream, addr)) => {
                        println!("🔗 New WebSocket connection from: {}", addr);
                        let broadcast_tx_clone = broadcast_tx.clone();
                        let shared_state_clone = shared_state.clone();
                        
                        tokio::spawn(async move {
                            match accept_async(stream).await {
                                Ok(ws_stream) => {
                                    let (mut ws_write, mut ws_read) = ws_stream.split();
                                    let _rx = broadcast_tx_clone.subscribe();
                                    
                                    // ส่ง state ปัจจุบันจาก shared_state ให้ overlay ทุกครั้งที่เชื่อมต่อใหม่
                                    let current_state = {
                                        let state_guard = shared_state_clone.lock().unwrap();
                                        (*state_guard).clone()
                                    };
                                    let current_msg = serde_json::to_string(&current_state).unwrap();
                                    let _ = ws_write.send(Message::Text(current_msg)).await;
                                    println!("📡 Sent current state to new connection: {:?}", current_state);
                                    
                                    // สร้าง receiver ใหม่สำหรับ send task
                                    let mut rx_send = broadcast_tx_clone.subscribe();
                                    let mut ws_write_send = ws_write;
                                    
                                    // Task to send state updates
                                    let send_task = tokio::spawn(async move {
                                        while let Ok(state) = rx_send.recv().await {
                                            println!("📡 Sending state update: {:?}", state);
                                            let msg = serde_json::to_string(&state).unwrap();
                                            match ws_write_send.send(Message::Text(msg)).await {
                                                Ok(_) => {},
                                                Err(e) => {
                                                    println!("❌ Failed to send message: {}", e);
                                                    break;
                                                }
                                            }
                                        }
                                        println!("📡 Send task ended");
                                    });
                                    
                                    // สร้าง receiver ใหม่สำหรับ read task
                                    let _rx_read = broadcast_tx_clone.subscribe();
                                    
                                    // Task to handle incoming messages and keepalive
                                    let read_task = tokio::spawn(async move {
                                        while let Some(msg) = ws_read.next().await {
                                            match msg {
                                                Ok(Message::Text(text)) => {
                                                    // จัดการคำขอข้อมูลปัจจุบัน
                                                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                                                        if let Some(msg_type) = json.get("type").and_then(|v| v.as_str()) {
                                                            match msg_type {
                                                                "toggle_goal" => {
                                                                    if let Some(val) = json.get("value").and_then(|v| v.as_bool()) {
                                                                        let mut state = shared_state_clone.lock().unwrap();
                                                                        state.show_goal = val;
                                                                        let _ = broadcast_tx_clone.send(state.clone());
                                                                        println!("🔄 show_goal updated via overlay: {}", val);
                                                                    }
                                                                },
                                                                "toggle_crown" => {
                                                                    if let Some(val) = json.get("value").and_then(|v| v.as_bool()) {
                                                                        let mut state = shared_state_clone.lock().unwrap();
                                                                        state.show_crown = val;
                                                                        let _ = broadcast_tx_clone.send(state.clone());
                                                                        println!("🔄 show_crown updated via overlay: {}", val);
                                                                    }
                                                                },
                                                                "request_current_data" => {
                                                                    println!("📤 Received request for current data (no reply, client will get initial state)");
                                                                },
                                                                "update" => {
                                                                    // Handle state update from main app
                                                                    println!("📥 Received update message: {}", text);
                                                                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                                                                        println!("📥 Parsed JSON: {:?}", json);
                                                                        // Extract WinState fields from the update message
                                                                        if let (Some(win), Some(goal), Some(show_goal), Some(show_crown), Some(current_preset)) = (
                                                                            json.get("win").and_then(|v| v.as_i64()).map(|v| v as i32),
                                                                            json.get("goal").and_then(|v| v.as_i64()).map(|v| v as i32),
                                                                            json.get("show_goal").and_then(|v| v.as_bool()),
                                                                            json.get("show_crown").and_then(|v| v.as_bool()),
                                                                            json.get("current_preset").and_then(|v| v.as_str())
                                                                        ) {
                                                                            let mut state = shared_state_clone.lock().unwrap();
                                                                            state.win = win;
                                                                            state.goal = goal;
                                                                            state.show_goal = show_goal;
                                                                            state.show_crown = show_crown;
                                                                            state.current_preset = current_preset.to_string();
                                                                            let _ = broadcast_tx_clone.send(state.clone());
                                                                            println!("🔄 State updated via WebSocket: {:?}", state);
                                                                        } else {
                                                                            println!("❌ Failed to extract WinState fields from update message");
                                                                            println!("❌ Available fields: win={:?}, goal={:?}, show_goal={:?}, show_crown={:?}, current_preset={:?}",
                                                                                json.get("win"), json.get("goal"), json.get("show_goal"), json.get("show_crown"), json.get("current_preset"));
                                                                        }
                                                                    } else {
                                                                        println!("❌ Failed to parse update message as JSON");
                                                                    }
                                                                },
                                                                _ => {
                                                                    println!("📥 Received unknown message type: {}", msg_type);
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                Ok(Message::Ping(_)) => {
                                                    println!("🏓 Received ping, sending pong");
                                                    // Pong will be handled automatically
                                                },
                                                Ok(Message::Close(_)) => {
                                                    println!("👋 WebSocket close message received");
                                                    break;
                                                },
                                                Err(e) => {
                                                    println!("❌ WebSocket read error: {}", e);
                                                    break;
                                                }
                                                _ => {}
                                            }
                                        }
                                        println!("📖 Read task ended");
                                    });
                                    
                                    // Wait for either task to complete
                                    tokio::select! {
                                        _ = send_task => println!("🔚 Send task completed"),
                                        _ = read_task => println!("🔚 Read task completed"),
                                    }
                                    
                                    println!("🔌 WebSocket connection closed");
                                },
                                Err(e) => {
                                    println!("❌ Failed to accept WebSocket: {}", e);
                                }
                            }
                        });
                    },
                    Err(e) => {
                        println!("❌ Failed to accept TCP connection: {}", e);
                    }
                }
            }
        });
    });
}

fn main() {
    run()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let path = get_state_path();
    let mut initial = load_state(&path);
    
    // Validate current_preset exists in presets, fallback to Default if not
    if let Ok(presets) = load_presets() {
        if !presets.iter().any(|p| p.name == initial.current_preset) {
            println!("⚠️ Current preset '{}' not found in presets, falling back to 'Default'", initial.current_preset);
            initial.current_preset = "Default".to_string();
            
            // Update the state file with the corrected preset
            save_state(&path, &initial);
        }
    }
    
    let shared_state = Arc::new(Mutex::new(initial));
    let (broadcast_tx, _broadcast_rx) = broadcast::channel::<WinState>(32);
    let key_tracker: KeyTrackerMap = Arc::new(Mutex::new(HashMap::new()));
    
    // Start HTTP server for overlay.html
    start_http_server();
    
    // Start WebSocket server
    start_ws_server(shared_state.clone(), broadcast_tx.clone());
    
    // Start Heartbeat monitoring (will be started in setup)
    
    tauri::Builder::default()
        .manage(shared_state.clone())
        .manage(broadcast_tx.clone())
        .manage(key_tracker.clone())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())

        .invoke_handler(tauri::generate_handler![greet, get_app_version, a1b2c3d4, s4v3k3y, m4c5h6n, update_hotkey, reload_hotkeys_command, test_hotkeys, get_win_state, set_win_state, minimize_app, hide_to_tray, show_from_tray, increase_win, decrease_win, increase_win_by_step, decrease_win_by_step, set_win, set_goal, toggle_goal_visibility, toggle_crown_visibility, copy_overlay_link, save_preset, load_presets, load_preset, delete_preset, rename_preset, play_test_sounds, clear_hotkeys, save_default_hotkeys, check_hotkey_file, save_custom_sound, get_custom_sound_path, delete_custom_sound, read_sound_file, get_custom_sound_filename, check_for_updates, download_and_install_update, install_update_and_restart, create_promptpay_qr])
        .setup({
            let shared_state = Arc::clone(&shared_state);
            let broadcast_tx = broadcast_tx.clone();
            let _key_tracker = key_tracker.clone();
            
            move |app| {
                let app_handle: Arc<tauri::AppHandle> = Arc::new(app.handle().clone());
                let state: SharedWinState = Arc::clone(&shared_state);
                let gs = app_handle.global_shortcut();
                let gs_manager_state: GlobalShortcutManager = Arc::new(Mutex::new(Some(app.handle().clone())));
                
                // Register the global shortcut manager with the app
                app.manage(gs_manager_state.clone());
                
                println!("🎮 Registering dynamic global shortcuts...");
                
                // Use the dynamic registration function instead of duplicating logic
                match register_hotkeys_dynamically(&app_handle, &state, &broadcast_tx) {
                    Ok(_) => {
                        println!("✅ Dynamic hotkeys registered successfully in setup");
                    },
                    Err(e) => {
                        println!("❌ Failed to register dynamic hotkeys in setup: {}", e);
                        // Don't register fallback hotkeys to avoid conflicts
                        println!("⚠️ Skipping fallback hotkeys to avoid registration conflicts");
                    }
                }
                
                // Start Heartbeat monitoring
                m0n1t0r(app.handle().clone());
                
                // Start Enhanced Security Monitor
                start_security_monitor(app.handle().clone());
                
                // Setup System Tray with enhanced menu
                println!("🎯 Setting up system tray...");
                let show_menu_item = MenuItemBuilder::with_id("show", "👑 Show Win Counter").build(app)?;
                let current_win_item = MenuItemBuilder::with_id("current_win", "📊 Current Win: 0").build(app)?;
                let current_goal_item = MenuItemBuilder::with_id("current_goal", "🎯 Current Goal: 10").build(app)?;
                let quit_menu_item = MenuItemBuilder::with_id("quit", "❌ Quit Win Count").build(app)?;
                
                let tray_menu = MenuBuilder::new(app)
                    .items(&[&show_menu_item, &current_win_item, &current_goal_item, &quit_menu_item])
                    .build()?;
                
                let tray = app.tray_by_id("main").unwrap();
                tray.set_menu(Some(tray_menu))?;
                tray.on_menu_event({
                    let app_handle = app_handle.clone();
                    let state = state.clone();
                    move |app, event| {
                        match event.id.as_ref() {
                            "show" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    // Add animation effect
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                    
                                    // Play sound effect
                                    let _ = app_handle.emit("play-sound", "show");
                                }
                            }
                            "quit" => {
                                // Add confirmation or animation before quit
                                println!("🔄 Quitting Win Count by ArtYWoof...");
                                app.exit(0);
                            }
                            _ => {}
                        }
                    }
                });
                
                // Update tray menu with current values periodically
                let tray_clone = tray.clone();
                let state_clone = state.clone();
                std::thread::spawn(move || {
                    loop {
                        std::thread::sleep(std::time::Duration::from_secs(5));
                        let current_state = state_clone.lock().unwrap();
                        let win_text = format!("📊 Current Win: {}", current_state.win);
                        let goal_text = format!("🎯 Current Goal: {}", current_state.goal);
                        
                        // Note: Tray menu updates are handled by Tauri internally
                        // This thread is kept for potential future enhancements
                    }
                });
                
                println!("✅ System tray setup completed");
                
                println!("✅ Application setup completed");
                
                Ok(())
            }
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                println!("🔒 Close requested, attempting to hide window to tray...");
                match window.hide() {
                    Ok(_) => {
                        println!("✅ Window hidden to tray successfully");
                        api.prevent_close();
                    },
                    Err(e) => {
                        println!("❌ Failed to hide window: {:?}", e);
                        // Try alternative approach - minimize instead of hide
                        match window.minimize() {
                            Ok(_) => {
                                println!("✅ Window minimized as fallback");
                                api.prevent_close();
                            },
                            Err(e2) => {
                                println!("❌ Failed to minimize window: {:?}", e2);
                                // Last resort - allow close but don't exit app
                                api.prevent_close();
                            }
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// --- Security State ---
static T4MP3R_C0UNT: AtomicUsize = AtomicUsize::new(0);
static GR4C3_P3R10D: AtomicBool = AtomicBool::new(false);
static mut GRACE_PERIOD_START: Option<DateTime<Utc>> = None;
const GRACE_PERIOD_DURATION: i64 = 5 * 60; // 5 นาที (วินาที)

// --- Anti-Debugging & Tamper Detection ---
static ANTI_DEBUG_ACTIVE: AtomicBool = AtomicBool::new(false);
static HASH_VERIFICATION_ACTIVE: AtomicBool = AtomicBool::new(false);
static mut APP_HASH_CACHE: Option<String> = None;

#[cfg(windows)]
use winapi::um::winuser::FindWindowA;
#[cfg(windows)]
use winapi::um::processthreadsapi::GetCurrentProcess;
#[cfg(windows)]
extern "system" {
    fn IsDebuggerPresent() -> i32;
}

// --- Heartbeat System ---
static H3A2T_4CT1V3: AtomicBool = AtomicBool::new(false);
static mut LAST_HEARTBEAT: Option<DateTime<Utc>> = None;
const HEARTBEAT_INTERVAL: u64 = 30; // 30 วินาที

fn h4s5h6(path: &str) -> Option<String> {
    let mut file = File::open(path).ok()?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 4096];
    loop {
        let n = file.read(&mut buffer).ok()?;
        if n == 0 { break; }
        hasher.update(&buffer[..n]);
    }
    Some(format!("{:x}", hasher.finalize()))
}

// Anti-Debugging functions
#[cfg(windows)]
fn is_debugger_present() -> bool {
    unsafe { IsDebuggerPresent() != 0 }
}

#[cfg(not(windows))]
fn is_debugger_present() -> bool {
    false // Placeholder for non-Windows platforms
}

#[cfg(windows)]
fn detect_debugging_tools() -> bool {
    use std::ffi::CString;
    
    let debug_tools = [
        "ollydbg", "windbg", "x64dbg", "ida", "ghidra", 
        "cheat engine", "process hacker", "processhacker"
    ];
    
    for tool in &debug_tools {
        if let Ok(tool_name) = CString::new(*tool) {
            unsafe {
                if FindWindowA(tool_name.as_ptr(), std::ptr::null()) != std::ptr::null_mut() {
                    return true;
                }
            }
        }
    }
    false
}

#[cfg(not(windows))]
fn detect_debugging_tools() -> bool {
    false // Placeholder for non-Windows platforms
}

// Enhanced hash verification with multiple files
fn verify_app_integrity() -> bool {
    let critical_files = [
        "win-count-by-artywoof.exe",
        "tauri.conf.json",
        "WebView2Loader.dll"
    ];
    
    for file in &critical_files {
        if let Some(current_hash) = h4s5h6(file) {
            // In production, these hashes should be hardcoded or encrypted
            println!("[SECURITY] Verifying integrity of: {} - Hash: {}", file, &current_hash[..16]);
            
            // Store hash in cache for comparison
            unsafe {
                if APP_HASH_CACHE.is_none() {
                    APP_HASH_CACHE = Some(current_hash.clone());
                }
            }
        } else {
            println!("[SECURITY] ⚠️ Could not verify integrity of: {}", file);
            return false;
        }
    }
    true
}

// Registry tamper detection (Windows only)
#[cfg(windows)]
fn check_registry_tampering() -> bool {
    use winapi::um::winreg::{RegOpenKeyExA, RegQueryValueExA, HKEY_LOCAL_MACHINE};
    use winapi::um::winnt::{KEY_READ, REG_SZ};
    use std::ffi::CString;
    use std::ptr;
    
    // Check common registry keys that might be modified
    let registry_paths = [
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        "SOFTWARE\\Classes\\Applications",
    ];
    
    for path in &registry_paths {
        if let Ok(path_cstring) = CString::new(*path) {
            let mut hkey = ptr::null_mut();
            unsafe {
                let result = RegOpenKeyExA(
                    HKEY_LOCAL_MACHINE,
                    path_cstring.as_ptr(),
                    0,
                    KEY_READ,
                    &mut hkey
                );
                
                if result == 0 {
                    // Registry key exists, perform additional checks if needed
                    println!("[SECURITY] Registry key accessible: {}", path);
                }
            }
        }
    }
    true // Return true for now, implement specific checks as needed
}

#[cfg(not(windows))]
fn check_registry_tampering() -> bool {
    true // Always return true on non-Windows platforms
}

fn i9n8t7g() -> bool {
    // ตรวจสอบ hash ของ main.rs, tauri.conf.json, และ binary
    let main_hash = h4s5h6("src-tauri/src/main.rs");
    let conf_hash = h4s5h6("src-tauri/tauri.conf.json");
    let exe_hash = std::env::current_exe().ok().and_then(|p| h4s5h6(p.to_str().unwrap_or("")));
    // hash เหล่านี้ควรเก็บค่าไว้ตอน build (hardcode หรืออ่านจากไฟล์)
    let expected_main = option_env!("EXPECTED_MAIN_HASH");
    let expected_conf = option_env!("EXPECTED_CONF_HASH");
    let expected_exe = option_env!("EXPECTED_EXE_HASH");
    let mut tampered = false;
    if let (Some(h), Some(e)) = (main_hash, expected_main) { if h != e { tampered = true; } }
    if let (Some(h), Some(e)) = (conf_hash, expected_conf) { if h != e { tampered = true; } }
    if let (Some(h), Some(e)) = (exe_hash, expected_exe) { if h != e { tampered = true; } }
    tampered
}

// Enhanced security monitor with anti-debugging
fn start_security_monitor(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_secs(30));
            
            // Anti-Debugging Detection
            if is_debugger_present() || detect_debugging_tools() {
                let _ = app.emit("security_issue", "🚨 ตรวจพบ Debugger หรือ Hacking Tools - แอปจะปิดทันที".to_string());
                println!("[SECURITY] 🚨 Debugger or hacking tools detected!");
                std::process::exit(1); // Force exit immediately
            }
            
            // App Integrity Verification
            if !verify_app_integrity() {
                let count = T4MP3R_C0UNT.fetch_add(1, Ordering::SeqCst) + 1;
                let msg = format!("🔍 ตรวจพบการแก้ไขไฟล์แอป ({} / 3)", count);
                let _ = app.emit("security_issue", msg.clone());
                println!("[SECURITY] {}", msg);
                
                if count >= 3 {
                    let _ = app.emit("security_issue", "⛔ ตรวจพบการแก้ไขไฟล์เกิน 3 ครั้ง - แอปถูกบล็อก".to_string());
                    println!("[SECURITY] ⛔ App tampering detected - blocking application");
                    std::process::exit(1); // Force exit on tampering
                }
            }
            
            // Registry Tampering Check
            if !check_registry_tampering() {
                let _ = app.emit("security_issue", "⚠️ ตรวจพบการแก้ไข Registry ที่น่าสงสัย".to_string());
                println!("[SECURITY] ⚠️ Suspicious registry modifications detected");
            }
            
            // Original Tamper Detection
            if i9n8t7g() {
                let count = T4MP3R_C0UNT.fetch_add(1, Ordering::SeqCst) + 1;
                let msg = format!("ตรวจพบการแก้ไขไฟล์ระบบ ({} / 5)", count);
                let _ = app.emit("security_issue", msg.clone());
                println!("[SECURITY] {}", msg);
                if count >= 5 {
                    let _ = app.emit("security_issue", "⛔ ตรวจพบการแก้ไขระบบเกิน 5 ครั้ง แอปถูกบล็อก".to_string());
                }
            }
            
            // Grace Period
            if GR4C3_P3R10D.load(Ordering::SeqCst) {
                let now = Utc::now();
                let expired = unsafe {
                    if let Some(start) = GRACE_PERIOD_START {
                        (now - start).num_seconds() > GRACE_PERIOD_DURATION
                    } else { false }
                };
                if expired {
                    let _ = app.emit("security_issue", "⛔ หมดเวลา Grace Period กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อตรวจสอบ License".to_string());
                    println!("[SECURITY] Grace period expired, blocking app");
                }
            }
        }
    });
}

// Heartbeat function - ส่งสัญญาณไป License Server ทุก 30 วินาที
async fn h3a2r1t() -> Result<bool, String> {
    if let Ok(license_path) = get_app_data_file("win_count_license.json") {
        if let Ok(license_content) = fs::read_to_string(&license_path) {
            if let Ok(license_data) = serde_json::from_str::<serde_json::Value>(&license_content) {
                if let Some(license_key) = license_data.get("license_key").and_then(|v| v.as_str()) {
                    if let Ok(machine_id) = m4c5h6n() {
                        let timestamp = Utc::now().timestamp();
                        
                        // สร้าง signature จาก Machine ID + Timestamp + License Key
                        let signature_data = format!("{}:{}:{}", machine_id, timestamp, license_key);
                        let mut hasher = Sha256::new();
                        hasher.update(signature_data.as_bytes());
                        let signature = format!("{:x}", hasher.finalize());
                        
                        let client = reqwest::Client::new();
                        let url = format!("{}/heartbeat", L1C3NS3_S3RV3R);
                        
                        if !url.starts_with("https://") {
                            println!("[SECURITY] Heartbeat server URL is not HTTPS!");
                            return Ok(false);
                        }
                        
                        let heartbeat_data = serde_json::json!({
                            "license_key": license_key,
                            "machine_id": machine_id,
                            "timestamp": timestamp,
                            "signature": signature,
                            "app_version": env!("CARGO_PKG_VERSION")
                        });
                        
                        let response = client
                            .post(&url)
                            .header("Content-Type", "application/json")
                            .json(&heartbeat_data)
                            .send()
                            .await;
                        
                        match response {
                            Ok(resp) => {
                                let status = resp.status();
                                let body = resp.text().await.unwrap_or_default();
                                println!("[HEARTBEAT] Server response: {} - {}", status, body);
                                
                                if status.is_success() {
                                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
                                        if let Some(valid) = json.get("valid").and_then(|v| v.as_bool()) {
                                            if valid {
                                                unsafe { LAST_HEARTBEAT = Some(Utc::now()); }
                                                return Ok(true);
                                            }
                                        }
                                    }
                                }
                                
                                // ถ้า response ไม่ success หรือ license ไม่ valid
                                println!("[HEARTBEAT] License validation failed");
                                GR4C3_P3R10D.store(true, Ordering::SeqCst);
                                unsafe { GRACE_PERIOD_START = Some(Utc::now()); }
                                return Ok(false);
                            }
                            Err(e) => {
                                println!("[HEARTBEAT] Network error: {}", e);
                                // Activate Grace Period เมื่อไม่สามารถเชื่อมต่อได้
                                GR4C3_P3R10D.store(true, Ordering::SeqCst);
                                unsafe { GRACE_PERIOD_START = Some(Utc::now()); }
                                return Ok(false);
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(false)
}

// Start heartbeat monitoring
fn m0n1t0r(app: tauri::AppHandle) {
    if H3A2T_4CT1V3.load(Ordering::SeqCst) {
        return; // Already running
    }
    
    H3A2T_4CT1V3.store(true, Ordering::SeqCst);
    
    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        loop {
            std::thread::sleep(std::time::Duration::from_secs(HEARTBEAT_INTERVAL));
            
            if !H3A2T_4CT1V3.load(Ordering::SeqCst) {
                break; // Stop if disabled
            }
            
            println!("[HEARTBEAT] Sending heartbeat to license server...");
            
            let result = rt.block_on(async {
                h3a2r1t().await
            });
            
            match result {
                Ok(valid) => {
                    if valid {
                        println!("[HEARTBEAT] ✅ License valid");
                        // Reset grace period if license is valid
                        GR4C3_P3R10D.store(false, Ordering::SeqCst);
                    } else {
                        println!("[HEARTBEAT] ❌ License invalid or network error");
                        let _ = app.emit("security_issue", "⚠️ ตรวจพบปัญหา License กรุณาตรวจสอบการเชื่อมต่อ".to_string());
                    }
                }
                Err(e) => {
                    println!("[HEARTBEAT] ❌ Error: {}", e);
                    let _ = app.emit("security_issue", "⚠️ เกิดข้อผิดพลาดในการตรวจสอบ License".to_string());
                }
            }
        }
    });
}

