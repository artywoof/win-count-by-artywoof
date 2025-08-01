# 🚀 Release Guide - Win Count by ArtYWoof

## 📋 การใช้งาน GitHub Actions

### 🎯 วิธีสร้าง Release

#### 1. **สร้าง Tag และ Push**
```bash
# สร้าง tag ใหม่
git tag v1.0.0

# Push tag ไปยัง GitHub
git push origin v1.0.0
```

#### 2. **Manual Trigger (ถ้าต้องการ)**
- ไปที่ GitHub Repository
- คลิก **Actions** tab
- เลือก **🚀 Release Win Count** workflow
- คลิก **Run workflow**
- เลือก branch และ version

### 🔧 การตั้งค่า Secrets

#### 1. **TAURI_PRIVATE_KEY**
```bash
# สร้าง private key สำหรับ Tauri
tauri signer generate -w ~/.tauri/win-count-by-artywoof.key

# Export private key
tauri signer export -w ~/.tauri/win-count-by-artywoof.key
```

#### 2. **TAURI_KEY_PASSWORD**
- รหัสผ่านที่ใช้สร้าง private key

#### 3. **ตั้งค่าใน GitHub**
- ไปที่ **Settings** > **Secrets and variables** > **Actions**
- เพิ่ม secrets:
  - `TAURI_PRIVATE_KEY`: Private key จากขั้นตอนที่ 1
  - `TAURI_KEY_PASSWORD`: รหัสผ่าน

### 📦 ผลลัพธ์ที่ได้

#### 1. **Release Assets**
- `Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi` - Installer
- `Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi.zip` - Compressed installer
- `latest.json` - Auto-update configuration

#### 2. **Auto-Update**
- แอปจะตรวจสอบ `latest.json` อัตโนมัติ
- ดาวน์โหลดและติดตั้งอัพเดทใหม่

### 🔄 Workflow Steps

#### 1. **create-release**
- สร้าง GitHub Release
- ตั้งชื่อและคำอธิบาย
- เตรียมสำหรับ upload assets

#### 2. **build-tauri**
- Setup Bun และ Rust
- Install dependencies
- Build frontend และ Tauri app
- Upload assets ไปยัง release

#### 3. **finalize-release**
- ตรวจสอบ release
- แสดงข้อมูล assets
- Log ผลลัพธ์

### 🛠️ การแก้ไขปัญหา

#### 1. **Build Failed**
```bash
# ตรวจสอบ logs ใน GitHub Actions
# ตรวจสอบ dependencies
bun install

# ตรวจสอบ Rust toolchain
rustup update
rustup target add x86_64-pc-windows-msvc
```

#### 2. **Signing Failed**
```bash
# ตรวจสอบ private key
tauri signer verify -w ~/.tauri/win-count-by-artywoof.key

# สร้าง key ใหม่ถ้าจำเป็น
tauri signer generate -w ~/.tauri/win-count-by-artywoof.key
```

#### 3. **Upload Failed**
- ตรวจสอบ GitHub Token permissions
- ตรวจสอบ repository permissions
- ตรวจสอบ file size limits

### 📝 Version Management

#### 1. **Semantic Versioning**
```
v1.0.0 - Major release
v1.1.0 - Minor release  
v1.0.1 - Patch release
```

#### 2. **Update package.json**
```json
{
  "version": "1.0.0"
}
```

#### 3. **Update tauri.conf.json**
```json
{
  "tauri": {
    "bundle": {
      "version": "1.0.0"
    }
  }
}
```

### 🎯 Best Practices

#### 1. **ก่อนสร้าง Release**
- ✅ ทดสอบแอปในเครื่อง
- ✅ ตรวจสอบ version numbers
- ✅ อัพเดท changelog
- ✅ ทดสอบ auto-update

#### 2. **หลังสร้าง Release**
- ✅ ตรวจสอบ assets ใน GitHub
- ✅ ทดสอบ installer
- ✅ ตรวจสอบ auto-update
- ✅ แจ้งผู้ใช้

#### 3. **Monitoring**
- ตรวจสอบ GitHub Actions logs
- ตรวจสอบ release downloads
- ตรวจสอบ user feedback

### 📞 Support

- **GitHub Issues**: [Create Issue](https://github.com/artywoof/win-count-by-artywoof/issues)
- **TikTok**: @artywoof
- **Documentation**: [README.md](README.md)

---

**Made with ❤️ by ArtYWoof** 