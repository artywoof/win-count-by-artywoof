# 🔄 Auto-Update Setup Guide

## 📋 Prerequisites

1. **GitHub Repository**: ต้องมี repository บน GitHub
2. **Signing Keys**: ต้องมี signing keys สำหรับ Tauri
3. **GitHub Secrets**: ต้องตั้งค่า secrets ใน repository

## 🔑 Setting up Signing Keys

### 1. Generate Signing Keys

```bash
# สร้าง signing key pair
tauri signer generate

# หรือใช้ minisign
minisign -G -p minisign.pub -s minisign.key
```

### 2. GitHub Secrets Setup

ไปที่ GitHub repository → Settings → Secrets and variables → Actions

เพิ่ม secrets ต่อไปนี้:

- `TAURI_SIGNING_PRIVATE_KEY`: Private key content (จากไฟล์ minisign.key)
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Password สำหรับ private key (ถ้ามี)

### 3. Public Key Configuration

Public key ใน `src-tauri/tauri.conf.json` ต้องตรงกับ public key ที่สร้างขึ้น

## 🚀 Release Process

### 1. Create New Version

```bash
# อัปเดต version ใน tauri.conf.json
# จาก "version": "1.0.1" เป็น "version": "1.0.2"

# สร้าง tag
git add .
git commit -m "Bump version to 1.0.2"
git tag v1.0.2
git push origin main
git push origin v1.0.2
```

### 2. Automatic Release

GitHub Actions จะ:
- Build แอพ
- สร้าง MSI installer
- Sign ไฟล์ด้วย private key
- สร้าง `latest.json` สำหรับ auto-update
- Release บน GitHub

### 3. Auto-Update Flow

1. แอพจะตรวจสอบ `latest.json` อัตโนมัติ
2. ถ้าพบเวอร์ชันใหม่ จะดาวน์โหลดอัตโนมัติ
3. แจ้งผู้ใช้ให้รีสตาร์ทเพื่ออัปเดต

## 🔧 Testing Auto-Update

### 1. Local Testing

```bash
# Build แอพในโหมด development
bun run tauri dev

# ทดสอบ auto-update ใน Settings
```

### 2. Production Testing

1. สร้าง release ใหม่
2. ติดตั้งแอพเวอร์ชันเก่า
3. ตรวจสอบว่า auto-update ทำงาน

## 📁 File Structure

```
src-tauri/
├── tauri.conf.json          # Tauri configuration
├── latest.json              # Auto-update template
└── keys/
    ├── minisign.pub         # Public key
    └── minisign.key         # Private key (ไม่ commit)

.github/
└── workflows/
    └── release.yml          # GitHub Actions workflow
```

## ⚠️ Important Notes

1. **Private Key Security**: อย่า commit private key เข้า repository
2. **Version Management**: อัปเดต version ใน `tauri.conf.json` ก่อนสร้าง tag
3. **Testing**: ทดสอบ auto-update ในโหมด development ก่อน release
4. **Backup**: สำรองข้อมูล signing keys ไว้ในที่ปลอดภัย

## 🐛 Troubleshooting

### Auto-update ไม่ทำงาน
- ตรวจสอบ public key ใน `tauri.conf.json`
- ตรวจสอบ GitHub secrets
- ตรวจสอบ endpoint URL

### Build Error
- ตรวจสอบ signing key format
- ตรวจสอบ password (ถ้ามี)
- ตรวจสอบ file permissions

## 📞 Support

หากมีปัญหาการตั้งค่า auto-update กรุณาติดต่อ:
- GitHub Issues: [Repository Issues](https://github.com/artywoof/win-count-by-artywoof/issues)
- Email: [Your Email]

---

**Note**: Auto-update system นี้ใช้ Tauri's built-in updater ซึ่งปลอดภัยและเชื่อถือได้ 