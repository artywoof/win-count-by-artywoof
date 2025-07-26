// License Key Generator for Win Count by ArtYWoof
// ใช้สำหรับสร้าง License Key สำหรับลูกค้า

const crypto = require('crypto');

// License Key ที่สร้างแล้ว
const generatedKeys = [
    'ARTY-WOOF-2024-WIN',  // Key ต้นฉบับ
    'MJAR-OON-ANDP-EART'   // Key ใหม่ที่คุณขอ
];

// ฟังก์ชันสร้าง License Key แบบสุ่ม
function generateRandomLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // สร้างรูปแบบ: XXXX-XXXX-XXXX-XXXX
    for (let i = 0; i < 19; i++) {
        if (i === 4 || i === 9 || i === 14) {
            result += '-';
        } else {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    return result;
}

// ฟังก์ชันสร้าง License Key แบบกำหนดเอง
function generateCustomLicenseKey(prefix = 'ARTY') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// แสดง License Key ที่มีอยู่
console.log('🔑 License Keys ที่สร้างแล้ว:');
generatedKeys.forEach((key, index) => {
    console.log(`${index + 1}. ${key}`);
});

console.log('\n🎲 License Keys แบบสุ่ม (สำหรับทดสอบ):');
for (let i = 0; i < 5; i++) {
    console.log(`${i + 1}. ${generateRandomLicenseKey()}`);
}

console.log('\n🎯 License Keys แบบกำหนดเอง:');
for (let i = 0; i < 3; i++) {
    console.log(`${i + 1}. ${generateCustomLicenseKey('WIN')}`);
}

console.log('\n📋 วิธีใช้งาน:');
console.log('1. ใช้ License Key ที่มีอยู่แล้ว');
console.log('2. หรือสร้างใหม่ด้วยฟังก์ชัน generateRandomLicenseKey()');
console.log('3. หรือสร้างแบบกำหนดเองด้วย generateCustomLicenseKey()');

// Export functions สำหรับใช้ในไฟล์อื่น
module.exports = {
    generateRandomLicenseKey,
    generateCustomLicenseKey,
    generatedKeys
}; 