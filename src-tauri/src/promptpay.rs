// src-tauri/src/promptpay.rs - PromptPay QR Code Generator

use serde::{Deserialize, Serialize};
use qrcode::{QrCode, EcLevel};
use image::{ImageBuffer, Luma, DynamicImage};
use base64::{Engine as _, engine::general_purpose};
use std::io::Cursor;

#[derive(Debug, Serialize, Deserialize)]
pub struct PromptPayPayment {
    pub qr_code_base64: String,
    pub payment_ref: String,
    pub amount: f64,
    pub phone_number: String,
    pub expires_at: String,
    pub qr_raw_data: String,
}

// สร้าง PromptPay QR Code ตามมาตรฐานไทย
pub fn generate_promptpay_qr(amount: f64, phone: &str) -> Result<PromptPayPayment, String> {
    // สร้าง Payment Reference ที่ไม่ซ้ำ
    let timestamp = chrono::Utc::now().timestamp();
    let random_num = rand::random::<u16>();
    let payment_ref = format!("PP{}{:04}", timestamp, random_num);
    
    // แปลงเบอร์โทรให้เป็นรูปแบบที่ธนาคารรู้จัก
    let formatted_phone = format_phone_number(phone)?;
    
    // สร้าง PromptPay QR Data ตามมาตรฐาน EMVCo
    let qr_data = create_promptpay_payload(&formatted_phone, amount, &payment_ref)?;
    
    // สร้าง QR Code image
    let qr_code = QrCode::with_error_correction_level(&qr_data, EcLevel::M)
        .map_err(|e| format!("QR Code creation failed: {}", e))?;
    
    // แปลง QR Code เป็น SVG string
    let svg_string = qr_code.render()
        .min_dimensions(200, 200)
        .dark_color(qrcode::render::svg::Color("#000000"))
        .light_color(qrcode::render::svg::Color("#FFFFFF"))
        .build();
    
    // แปลง SVG เป็น Base64
    let base64_image = general_purpose::STANDARD.encode(svg_string.as_bytes());
    
    // กำหนดเวลาหมดอายุ (15 นาที)
    let expires_at = chrono::Utc::now() + chrono::Duration::minutes(15);
    
    Ok(PromptPayPayment {
        qr_code_base64: base64_image,
        payment_ref,
        amount,
        phone_number: phone.to_string(),
        expires_at: expires_at.to_rfc3339(),
        qr_raw_data: qr_data,
    })
}

// แปลงเบอร์โทรให้เป็นรูปแบบมาตรฐาน
fn format_phone_number(phone: &str) -> Result<String, String> {
    // ลบ - และ space ออก
    let clean_phone = phone.replace("-", "").replace(" ", "");
    
    // ตรวจสอบรูปแบบเบอร์โทร
    if clean_phone.len() == 10 && clean_phone.starts_with("0") {
        // เบอร์ 0909783454 → 66909783454
        Ok(format!("66{}", &clean_phone[1..]))
    } else if clean_phone.len() == 9 && !clean_phone.starts_with("0") {
        // เบอร์ 909783454 → 66909783454  
        Ok(format!("66{}", clean_phone))
    } else if clean_phone.len() == 12 && clean_phone.starts_with("66") {
        // เบอร์ 66909783454 → ใช้ตามเดิม
        Ok(clean_phone)
    } else {
        Err(format!("Invalid phone number format: {}", phone))
    }
}

// สร้าง PromptPay payload ตามมาตรฐาน EMVCo
fn create_promptpay_payload(phone: &str, amount: f64, reference: &str) -> Result<String, String> {
    // EMVCo QR Code Standard for PromptPay
    let mut payload = String::new();
    
    // Payload Format Indicator
    payload.push_str("000201");
    
    // Point of Initiation Method
    payload.push_str("010212");
    
    // Merchant Account Information
    let merchant_info = format!("0016A000000677010111{:0>13}", phone);
    payload.push_str(&format!("29{:02}{}", merchant_info.len(), merchant_info));
    
    // Transaction Currency (THB = 764)
    payload.push_str("5303764");
    
    // Transaction Amount
    if amount > 0.0 {
        let amount_str = format!("{:.2}", amount);
        payload.push_str(&format!("54{:02}{}", amount_str.len(), amount_str));
    }
    
    // Country Code (TH)
    payload.push_str("5802TH");
    
    // Merchant Name
    let merchant_name = "Win Count App";
    payload.push_str(&format!("59{:02}{}", merchant_name.len(), merchant_name));
    
    // Merchant City
    let merchant_city = "Bangkok";
    payload.push_str(&format!("60{:02}{}", merchant_city.len(), merchant_city));
    
    // Additional Data Field (Reference)
    if !reference.is_empty() {
        let additional_data = format!("01{:02}{}", reference.len(), reference);
        payload.push_str(&format!("62{:02}{}", additional_data.len(), additional_data));
    }
    
    // CRC16 Checksum
    let crc = calculate_crc16(&format!("{}6304", payload));
    payload.push_str(&format!("63{:04X}", crc));
    
    Ok(payload)
}

// คำนวณ CRC16 สำหรับ PromptPay QR
fn calculate_crc16(data: &str) -> u16 {
    let mut crc: u16 = 0xFFFF;
    
    for byte in data.bytes() {
        crc ^= byte as u16;
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0x8408;
            } else {
                crc >>= 1;
            }
        }
    }
    
    !crc
}

// Tauri Command สำหรับสร้าง PromptPay QR
#[tauri::command]
pub async fn create_promptpay_payment(amount: f64) -> Result<PromptPayPayment, String> {
    let phone = "0909783454"; // เบอร์ PromptPay ใหม่
    
    println!("🔄 Creating PromptPay QR for amount: ฿{}", amount);
    
    let payment = generate_promptpay_qr(amount, phone)?;
    
    println!("✅ PromptPay QR created successfully!");
    println!("   Payment Ref: {}", payment.payment_ref);
    println!("   Phone: {}", payment.phone_number);
    println!("   Amount: ฿{}", payment.amount);
    
    Ok(payment)
}

// ตรวจสอบสถานะการชำระเงิน
#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentStatus {
    pub status: String, // "pending", "completed", "failed", "expired"
    pub payment_ref: String,
    pub license_key: Option<String>,
    pub paid_at: Option<String>,
}

#[tauri::command]
pub async fn check_promptpay_status(payment_ref: String) -> Result<PaymentStatus, String> {
    println!("🔍 Checking payment status for: {}", payment_ref);
    
    // TODO: ในโค้ดจริง ตรงนี้จะเช็คจากฐานข้อมูลหรือ webhook
    // สำหรับตอนนี้เราจะจำลองการตอบกลับ
    
    // ตรวจสอบว่า payment_ref หมดอายุหรือยัง
    if is_payment_expired(&payment_ref) {
        return Ok(PaymentStatus {
            status: "expired".to_string(),
            payment_ref,
            license_key: None,
            paid_at: None,
        });
    }
    
    // จำลองการตรวจสอบ (ในโค้ดจริงจะเช็คจากระบบธนาคาร)
    // สำหรับการทดสอบ เราจะสุ่มว่าจ่ายแล้วหรือยัง
    let is_paid = simulate_payment_check(&payment_ref);
    
    if is_paid {
        let license_key = generate_license_key();
        Ok(PaymentStatus {
            status: "completed".to_string(),
            payment_ref,
            license_key: Some(license_key),
            paid_at: Some(chrono::Utc::now().to_rfc3339()),
        })
    } else {
        Ok(PaymentStatus {
            status: "pending".to_string(),
            payment_ref,
            license_key: None,
            paid_at: None,
        })
    }
}

// ตรวจสอบว่า payment หมดอายุหรือยัง
fn is_payment_expired(payment_ref: &str) -> bool {
    // แยก timestamp จาก payment_ref (PP + timestamp + random)
    if let Some(timestamp_str) = payment_ref.strip_prefix("PP") {
        if let Some(timestamp_part) = timestamp_str.get(0..10) {
            if let Ok(timestamp) = timestamp_part.parse::<i64>() {
                let created_at = chrono::DateTime::from_timestamp(timestamp, 0);
                if let Some(created_time) = created_at {
                    let now = chrono::Utc::now();
                    let expires_at = created_time + chrono::Duration::minutes(15);
                    return now > expires_at;
                }
            }
        }
    }
    false
}

// จำลองการตรวจสอบการชำระเงิน (สำหรับการทดสอบ)
fn simulate_payment_check(payment_ref: &str) -> bool {
    // ในโค้ดจริง ตรงนี้จะเช็คจาก:
    // 1. Webhook จากธนาคาร
    // 2. API ตรวจสอบสถานะ
    // 3. ฐานข้อมูลที่บันทึกการชำระเงิน
    
    // สำหรับตอนนี้เราจะจำลองว่า 10% จะจ่ายสำเร็จ
    use rand::Rng;
    let mut rng = rand::thread_rng();
    rng.gen_range(0..100) < 10 // 10% chance ของการจ่ายสำเร็จ
}

// สร้าง License Key
fn generate_license_key() -> String {
    use rand::Rng;
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::thread_rng();
    
    let mut key = String::from("MONTH-");
    
    for i in 0..3 {
        for _ in 0..4 {
            let idx = rng.gen_range(0..chars.len());
            key.push(chars.chars().nth(idx).unwrap());
        }
        if i < 2 {
            key.push('-');
        }
    }
    
    key
} 