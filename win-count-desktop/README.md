# Win Count Desktop

Desktop application สำหรับ Win Count - เครื่องมือนับวินสำหรับสตรีมเมอร์ระดับโปร

## 🚀 Features

- **Win Counting**: นับวินแบบเรียลไทม์
- **Hotkeys**: ปุ่มลัดสำหรับเพิ่ม/ลดวิน
- **Overlay**: แสดงผลบน TikTok Live
- **Presets**: บันทึกค่าเริ่มต้นสำหรับแต่ละเกม
- **Payment Integration**: ชำระเงินผ่าน Omise
- **License Management**: ระบบ license แบบ monthly

## 📁 Project Structure

```
win-count-desktop/
├── src/
│   ├── lib/
│   │   ├── api.js
│   │   ├── components/
│   │   │   └── LicenseModal.svelte
│   │   └── licenseManager.js
│   ├── routes/
│   │   └── +page.svelte
│   └── app.html
├── src-tauri/
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://win-count-omise-api.vercel.app
   VITE_APP_NAME=Win Count
   VITE_APP_VERSION=1.0.0
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Build**:
   ```bash
   npm run build
   npm run tauri build
   ```

## 💳 Payment Methods

| Method | Fee | Features |
|--------|-----|----------|
| PromptPay | 0% | QR Code scanning |
| True Wallet | 1.65% | Direct app integration |
| Rabbit LINE Pay | 2.3% | Bangkok convenience |
| Credit/Debit | 2.65% | International cards |

## 🎮 Usage

1. **Install**: ดาวน์โหลดและติดตั้งแอป
2. **Activate**: เปิดใช้งานและใส่ license key
3. **Configure**: ตั้งค่า hotkeys และ overlay
4. **Stream**: เริ่มสตรีมและใช้ Win Count

## 🔑 License System

- **Monthly License**: ฿149/เดือน
- **Machine Binding**: ผูกกับเครื่องเดียว
- **Auto Renewal**: ต่ออายุอัตโนมัติ
- **Offline Support**: ทำงานได้แม้ไม่มี internet

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Rust (for Tauri)
- Git

### Commands
```bash
# Development
npm run dev

# Build
npm run build
npm run tauri build

# Preview
npm run preview
```

## 📦 Distribution

### Windows
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### macOS
```bash
npm run tauri build -- --target x86_64-apple-darwin
```

### Linux
```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

## 🔧 Configuration

### Hotkeys
- `Alt+=`: เพิ่มวิน 1
- `Alt+-`: ลดวิน 1
- `Alt+Shift+=`: เพิ่มวิน 10
- `Alt+Shift+-`: ลดวิน 10

### Overlay Settings
- Position: ปรับตำแหน่งได้
- Size: ขนาดตัวอักษร
- Theme: เลือกธีมได้
- Transparency: ความโปร่งใส

## 📝 License

MIT License - Win Count by ArtYWoof 