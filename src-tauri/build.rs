use std::fs;
use std::path::Path;

fn main() {
    // Code Obfuscation temporarily disabled for compilation
    println!("⚠️  Code obfuscation disabled for debugging");
    
    // Skip obfuscation for now
    // obfuscate_source_file("src/main.rs");
    
    println!("✅ Build script completed");
    tauri_build::build()
}

fn obfuscate_source_file(file_path: &str) {
    if !Path::new(file_path).exists() {
        return;
    }
    
    println!("🔒 Obfuscating: {}", file_path);
    
    // Read the source file
    let content = match fs::read_to_string(file_path) {
        Ok(content) => content,
        Err(_) => return,
    };
    
    // Simple obfuscation techniques
    let obfuscated = obfuscate_content(&content);
    
    // Write obfuscated content to a temporary file
    let temp_path = format!("{}.obfuscated", file_path);
    if let Err(_) = fs::write(&temp_path, obfuscated) {
        return;
    }
    
    // Replace original with obfuscated version
    if let Err(_) = fs::rename(&temp_path, file_path) {
        // If rename fails, try copy and delete
        if let Ok(_) = fs::copy(&temp_path, file_path) {
            let _ = fs::remove_file(&temp_path);
        }
    }
}

fn obfuscate_content(content: &str) -> String {
    let mut obfuscated = content.to_string();
    
    // Technique 1: Replace common function names with obfuscated names
    let obfuscation_map = [
        ("is_license_valid", "x7y9z2"),
        ("validate_license_key", "a1b2c3d4"),
        ("send_heartbeat", "h3a2r1t"),
        ("start_heartbeat_monitor", "m0n1t0r"),
        ("check_integrity", "i9n8t7g"),
        ("hash_file", "h4s5h6"),
        ("get_machine_id", "m4c5h6n"),
        ("save_license_key", "s4v3k3y"),
        ("LICENSE_SERVER_URL", "L1C3NS3_S3RV3R"),
        ("HEARTBEAT_ACTIVE", "H3A2T_4CT1V3"),
        ("GRACE_PERIOD_ACTIVE", "GR4C3_P3R10D"),
        ("TAMPER_COUNT", "T4MP3R_C0UNT"),
    ];
    
    for (original, obfuscated_name) in &obfuscation_map {
        obfuscated = obfuscated.replace(original, obfuscated_name);
    }
    
    // Technique 2: Add random comments to confuse
    let random_comments = [
        "// Obfuscated code - do not modify",
        "// Security layer 1",
        "// Anti-tamper protection",
        "// License validation system",
        "// Heartbeat monitoring",
        "// Machine ID verification",
    ];
    
    for comment in &random_comments {
        if obfuscated.contains("fn ") {
            obfuscated = obfuscated.replacen("fn ", &format!("{}\nfn ", comment), 1);
        }
    }
    
    // Technique 3: Add dummy variables to confuse static analysis
    let dummy_vars = [
        "const _dummy_var_1: u32 = 0xdeadbeef;",
        "const _dummy_var_2: u32 = 0xcafebabe;",
        "const _dummy_var_3: u32 = 0x12345678;",
    ];
    
    for dummy_var in &dummy_vars {
        if obfuscated.contains("fn ") {
            obfuscated = obfuscated.replacen("fn ", &format!("{}\nfn ", dummy_var), 1);
        }
    }
    
    obfuscated
}
