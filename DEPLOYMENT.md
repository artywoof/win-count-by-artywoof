# 🚀 Win Count Deployment Guide

คู่มือการ Deploy โปรเจค Win Count ทั้ง Backend และ Frontend

## 📋 Overview

โปรเจค Win Count ประกอบด้วย 2 ส่วนหลัก:
1. **Backend API** (Vercel) - ระบบชำระเงินและ license
2. **Frontend Desktop** (Tauri) - แอปพลิเคชันเดสก์ท็อป

## 🔧 Backend Deployment (Vercel)

### 1. สร้าง Vercel Project

```bash
# Clone repository
git clone https://github.com/your-username/win-count-omise-api.git
cd win-count-omise-api

# Install dependencies
npm install

# Deploy to Vercel
npm run deploy
```

### 2. ตั้งค่า Environment Variables

ใน Vercel Dashboard > Settings > Environment Variables:

```env
# Omise Configuration
OMISE_PUBLIC_KEY=pkey_test_64lscvwq1vrcw00i3fe
OMISE_SECRET_KEY=skey_test_64lscvxfhjntnv34gv0
OMISE_WEBHOOK_SECRET=whsec_test_64lscvwq1vrcw00i3fe

# API Configuration
API_BASE_URL=https://win-count-omise-api.vercel.app

# Security Configuration
RATE_LIMIT_PAYMENT=50
RATE_LIMIT_LICENSE=100
RATE_LIMIT_WINDOW=60000
```

### 3. ตั้งค่า Webhook URL

ใน Omise Dashboard > Webhooks:
- **URL**: `https://your-api.vercel.app/api/omise-webhook`
- **Events**: `charge.complete`, `charge.update`, `charge.failed`

## 🖥️ Frontend Deployment (Tauri)

### 1. Build Desktop App

```bash
# Clone repository
git clone https://github.com/your-username/win-count-desktop.git
cd win-count-desktop

# Install dependencies
npm install

# Build for production
npm run build
npm run tauri build
```

### 2. ตั้งค่า API URL

แก้ไขไฟล์ `src/lib/api.js`:
```javascript
const API_BASE = 'https://your-api.vercel.app';
```

### 3. Build Executables

#### Windows (.exe)
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

#### macOS (.app)
```bash
npm run tauri build -- --target x86_64-apple-darwin
```

#### Linux (.AppImage)
```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

## 📦 Distribution

### 1. สร้าง Installer

#### Windows (Inno Setup)
```inno
[Setup]
AppName=Win Count
AppVersion=1.0.0
DefaultDirName={pf}\Win Count by ArtYWoof
DefaultGroupName=Win Count
OutputDir=installer
OutputBaseFilename=WinCount-Setup-1.0.0

[Files]
Source: "src-tauri/target/release/win-count.exe"; DestDir: "{app}"

[Icons]
Name: "{group}\Win Count"; Filename: "{app}\win-count.exe"
Name: "{commondesktop}\Win Count"; Filename: "{app}\win-count.exe"
```

#### macOS (.dmg)
```bash
# Create DMG
hdiutil create -volname "Win Count" -srcfolder "src-tauri/target/release/bundle/macos/" "WinCount-1.0.0.dmg"
```

### 2. Code Signing

#### Windows
```bash
# Purchase code signing certificate
# Use signtool.exe
signtool.exe sign /f certificate.p12 /p password "win-count.exe"
```

#### macOS
```bash
# Apple Developer Account required
codesign --force --deep --sign "Developer ID Application: Your Name" "Win Count.app"
```

## 🔐 Security

### 1. License Protection

```javascript
// Machine ID generation
const machineId = await invoke('get_machine_id');

// License validation
const isValid = await validateLicense(licenseKey, machineId);
```

### 2. Anti-Tampering

```rust
// Rust side - Tauri
#[tauri::command]
fn get_machine_id() -> String {
    // Generate unique machine identifier
    // Hash hardware info
}
```

### 3. Obfuscation

```bash
# JavaScript obfuscation
npm install javascript-obfuscator

# Build with obfuscation
npm run build:obfuscated
```

## 📊 Monitoring

### 1. Vercel Analytics

```javascript
// Add to backend
import { Analytics } from '@vercel/analytics/server';

export default async function handler(req, res) {
  // Track API usage
  Analytics.track('api_call', { endpoint: req.url });
}
```

### 2. Error Tracking

```javascript
// Frontend error tracking
window.addEventListener('error', (event) => {
  // Send to your error tracking service
  console.error('App Error:', event.error);
});
```

## 🔄 Auto Updates

### 1. Tauri Auto Updater

```toml
# tauri.conf.json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://your-update-server.com/updates.json"
      ],
      "dialog": true,
      "pubkey": "your-public-key"
    }
  }
}
```

### 2. Update Server

```json
// updates.json
{
  "version": "1.0.1",
  "notes": "Bug fixes and improvements",
  "pub_date": "2024-01-01T00:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "signature",
      "url": "https://github.com/your-repo/releases/download/v1.0.1/WinCount_1.0.1_x64.dmg"
    },
    "darwin-aarch64": {
      "signature": "signature",
      "url": "https://github.com/your-repo/releases/download/v1.0.1/WinCount_1.0.1_arm64.dmg"
    },
    "linux-x86_64": {
      "signature": "signature",
      "url": "https://github.com/your-repo/releases/download/v1.0.1/WinCount_1.0.1_amd64.AppImage"
    },
    "windows-x86_64": {
      "signature": "signature",
      "url": "https://github.com/your-repo/releases/download/v1.0.1/WinCount_1.0.1_x64-setup.exe"
    }
  }
}
```

## 💰 Payment Processing

### 1. Omise Configuration

```javascript
// Production keys
const omise = require('omise')({
  publicKey: 'pkey_live_xxx',
  secretKey: 'skey_live_xxx',
});
```

### 2. Webhook Security

```javascript
// Verify webhook signature
const expectedSignature = crypto
  .createHmac('sha256', process.env.OMISE_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');
```

## 📈 Analytics

### 1. User Analytics

```javascript
// Track user behavior
const analytics = {
  trackEvent: (event, properties) => {
    // Send to analytics service
    console.log('Event:', event, properties);
  }
};
```

### 2. Payment Analytics

```javascript
// Track payment success/failure
const paymentAnalytics = {
  trackPayment: (method, amount, success) => {
    // Track payment metrics
  }
};
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache
   npm run clean
   rm -rf node_modules
   npm install
   ```

2. **API Connection**
   ```javascript
   // Check API health
   fetch('https://your-api.vercel.app/api/health')
     .then(response => console.log('API Status:', response.status));
   ```

3. **License Issues**
   ```javascript
   // Debug license validation
   console.log('Machine ID:', machineId);
   console.log('License Key:', licenseKey);
   ```

## 📞 Support

- **Email**: support@win-count.com
- **Discord**: https://discord.gg/win-count
- **Documentation**: https://docs.win-count.com

---

**Win Count by ArtYWoof** - เครื่องมือนับวินสำหรับสตรีมเมอร์ระดับโปร 🎮 