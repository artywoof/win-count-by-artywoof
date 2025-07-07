# 📁 Win Count by ArtYWoof - Important Files List

## 🎯 สำหรับ AI Chatbot ตรวจสอบโปรเจกต์

### 📋 **Project Documentation & Status**
```
f:\win-count-by-artywoof\WIN_COUNT_CHECKLIST.md
f:\win-count-by-artywoof\URGENT_TODO.md
f:\win-count-by-artywoof\PROJECT_STATUS.md
f:\win-count-by-artywoof\README.md
f:\win-count-by-artywoof\PROJECT_ROADMAP.md
f:\win-count-by-artywoof\QUICK_REFERENCE.md
f:\win-count-by-artywoof\UI_QA_CHECKLIST.md
```

### 🎨 **Frontend Core Files (Svelte)**
```
f:\win-count-by-artywoof\src\routes\+page.svelte
f:\win-count-by-artywoof\src\routes\+layout.svelte
f:\win-count-by-artywoof\src\routes\+layout.ts
f:\win-count-by-artywoof\src\app.css
f:\win-count-by-artywoof\src\app.html
f:\win-count-by-artywoof\src\app.d.ts
```

### 🌐 **Overlay System Files**
```
f:\win-count-by-artywoof\src\routes\overlay\+page.svelte
f:\win-count-by-artywoof\src\routes\overlay\NeonCrownBox.svelte
f:\win-count-by-artywoof\static\overlay-websocket.html
f:\win-count-by-artywoof\overlay-bridge\server.js
```

### 🦀 **Backend Core Files (Rust/Tauri)**
```
f:\win-count-by-artywoof\src-tauri\src\main.rs
f:\win-count-by-artywoof\src-tauri\src\lib.rs
f:\win-count-by-artywoof\src-tauri\Cargo.toml
f:\win-count-by-artywoof\src-tauri\tauri.conf.json
f:\win-count-by-artywoof\src-tauri\capabilities\default.json
```

### 🧩 **Svelte Components**
```
f:\win-count-by-artywoof\src\lib\components\WinCounter.svelte
f:\win-count-by-artywoof\src\lib\components\GoalTracker.svelte
f:\win-count-by-artywoof\src\lib\components\WindowControls.svelte
f:\win-count-by-artywoof\src\lib\components\PresetManager.svelte
f:\win-count-by-artywoof\src\lib\components\SettingsModal.svelte
```

### 🔧 **TypeScript Libraries**
```
f:\win-count-by-artywoof\src\lib\stores.ts
f:\win-count-by-artywoof\src\lib\presetManager.ts
f:\win-count-by-artywoof\src\lib\audioManager.ts
f:\win-count-by-artywoof\src\lib\autoUpdater.ts
f:\win-count-by-artywoof\src\lib\index.ts
f:\win-count-by-artywoof\src\constants.ts
```

### ⚙️ **Configuration Files**
```
f:\win-count-by-artywoof\package.json
f:\win-count-by-artywoof\vite.config.js
f:\win-count-by-artywoof\svelte.config.js
f:\win-count-by-artywoof\tailwind.config.js
f:\win-count-by-artywoof\postcss.config.js
f:\win-count-by-artywoof\tsconfig.json
f:\win-count-by-artywoof\playwright.config.ts
```

### 🎭 **Assets & Resources**
```
f:\win-count-by-artywoof\src\assets\fonts\MiSansThai-Normal.ttf
f:\win-count-by-artywoof\src\assets\icons\
f:\win-count-by-artywoof\src\assets\sfx\increase.mp3
f:\win-count-by-artywoof\src\assets\sfx\decrease.mp3
f:\win-count-by-artywoof\src\assets\ui\app_crown.png
f:\win-count-by-artywoof\static\assets\ui\crown.png
```

### 🧪 **Testing Files**
```
f:\win-count-by-artywoof\tests\integration.spec.ts
f:\win-count-by-artywoof\test-manual.md
f:\win-count-by-artywoof\test-features.html
```

### 📊 **Logs & Reports**
```
f:\win-count-by-artywoof\logs\report-hotkey-to-overlay.txt
```

### 💾 **Backup Files (Reference)**
```
f:\win-count-by-artywoof\backup-20250629-163647\+page.svelte
f:\win-count-by-artywoof\backup-20250629-163647\+layout.svelte
f:\win-count-by-artywoof\backup-20250629-163647\app.css
f:\win-count-by-artywoof\BACKUP_PAGE_FINAL.svelte
f:\win-count-by-artywoof\BACKUP_APP_FINAL.css
```

---

## 🔍 **Quick Check Commands for AI**

### Check Main App Structure
```bash
# Main Svelte App
cat f:\win-count-by-artywoof\src\routes\+page.svelte | head -50

# Main CSS
cat f:\win-count-by-artywoof\src\app.css | head -50

# Tauri Config
cat f:\win-count-by-artywoof\src-tauri\tauri.conf.json

# Package.json
cat f:\win-count-by-artywoof\package.json
```

### Check Core Functionality
```bash
# Backend Logic
cat f:\win-count-by-artywoof\src-tauri\src\main.rs | head -100

# Overlay System
cat f:\win-count-by-artywoof\src\routes\overlay\+page.svelte

# WebSocket Server
cat f:\win-count-by-artywoof\overlay-bridge\server.js
```

### Check Project Status
```bash
# Checklist
cat f:\win-count-by-artywoof\WIN_COUNT_CHECKLIST.md

# Urgent TODO
cat f:\win-count-by-artywoof\URGENT_TODO.md

# Project Status
cat f:\win-count-by-artywoof\PROJECT_STATUS.md
```

---

## 📝 **File Descriptions for AI Context**

### **Core Application Logic**
- `src/routes/+page.svelte` - Main app interface with win counter, goal, presets, hotkeys
- `src-tauri/src/main.rs` - Rust backend with hotkey registration, state management, tray
- `src/app.css` - Modern UI styling with UE5/PS5/iPhone theme

### **Real-Time Sync System**
- `overlay-bridge/server.js` - WebSocket server for overlay communication
- `src/routes/overlay/+page.svelte` - Overlay interface for TikTok Live Studio
- `static/overlay-websocket.html` - Standalone overlay page

### **State Management**
- `src/lib/stores.ts` - Svelte stores for reactive state
- `src/lib/presetManager.ts` - Preset save/load functionality
- `src-tauri/src/lib.rs` - Rust state management and commands

### **Configuration & Build**
- `src-tauri/tauri.conf.json` - Tauri app configuration (window size, permissions)
- `package.json` - Dependencies and build scripts
- `tailwind.config.js` - CSS framework configuration

### **Missing/Incomplete Features**
- `src/lib/components/SettingsModal.svelte` - Settings UI (currently disabled)
- Audio settings implementation - Not yet created
- Hotkey customization UI - Not yet created
- Installation package setup - Not yet configured

---

## 🎯 **Key Areas for AI to Check**

### 1. **Functionality Status**
- Win counter: increment/decrement working?
- Hotkeys: Alt+=/- working globally?
- Overlay sync: Real-time updates working?
- Preset system: Save/load working?

### 2. **Missing Features**
- Audio settings: mute/unmute, custom sounds
- Hotkey customization: change key bindings
- Settings modal: currently disabled
- Installation package: not yet created

### 3. **Code Quality**
- TypeScript errors: any compilation issues?
- Performance: memory usage, startup time
- Error handling: proper error messages
- Code organization: clean structure

### 4. **User Experience**
- UI responsiveness: smooth animations
- Input validation: proper limits (-10,000 to 10,000)
- Error feedback: clear user messages
- Accessibility: keyboard navigation

---

## 💡 **AI Chatbot Instructions**

When checking this project, please:

1. **Read the status files first** (`WIN_COUNT_CHECKLIST.md`, `URGENT_TODO.md`)
2. **Check main application file** (`src/routes/+page.svelte`)
3. **Verify backend functionality** (`src-tauri/src/main.rs`)
4. **Test overlay system** (`src/routes/overlay/+page.svelte`)
5. **Review configuration** (`src-tauri/tauri.conf.json`, `package.json`)

**Focus on identifying:**
- What's working correctly ✅
- What's missing completely ❌
- What needs improvement ⚠️
- Any potential bugs or issues 🐛

---

*File list generated: July 3, 2025*  
*For AI Chatbot project analysis*
