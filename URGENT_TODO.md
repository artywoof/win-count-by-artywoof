# 🚨 URGENT TODO LIST - Win Count by ArtYWoof

## ❌ ฟีเจอร์ที่ยังขาดหายไป (Must Fix)

### 1. 🎵 AUDIO SETTINGS (ขาดทั้งหมด)
**Status**: ❌ Missing Completely
**Priority**: 🔥 CRITICAL
```
Required Features:
- [ ] ปุ่มปิด/เปิดเสียง (Mute/Unmute)
- [ ] อัพโหลดไฟล์เสียงเอง (.mp3)
- [ ] Settings modal สำหรับเสียง
- [ ] Volume control slider
- [ ] Preview sound button
```

### 2. ⌨️ HOTKEY CUSTOMIZATION (ขาดทั้งหมด)
**Status**: ❌ Missing Completely  
**Priority**: 🔥 CRITICAL
```
Required Features:
- [ ] Settings modal สำหรับเปลี่ยนคีลัด
- [ ] Key binding interface
- [ ] Conflict detection
- [ ] Reset to default
- [ ] Save custom hotkeys
```

### 3. 📝 PRESET NAME EDITING (ไม่สมบูรณ์)
**Status**: ⚠️ Partially Working
**Priority**: 🔥 CRITICAL
```
Current Issue:
- ชื่อ Preset ที่ผู้ใช้กำลังใช้อยู่ ยังพิมพ์แก้ไขไม่ได้ทันที
- ต้องเข้า Modal ถึงจะแก้ไขได้

Required Fix:
- [ ] พิมพ์ชื่อ Preset ได้เลยในหน้าหลัก
- [ ] Auto-save ชื่อเมื่อเปลี่ยน
- [ ] Validation ชื่อซ้ำ
```

### 4. 🎨 ENHANCED OVERLAY ANIMATIONS (พื้นฐานเท่านั้น)
**Status**: ⚠️ Basic Only
**Priority**: ⚡ High
```
Current State:
- มี animation พื้นฐาน
- สีแยกตามค่าพื้นฐาน

Required Improvements:
- [ ] Smooth number transitions
- [ ] Color-coded animations (ลบ/ศูนย์/บวก)
- [ ] Glow effects on change
- [ ] Bounce/Scale animations
- [ ] Progress bar to goal
```

---

## 🚀 DISTRIBUTION PREPARATION (ยังไม่เริ่ม)

### 5. 📦 INSTALLATION PACKAGE
**Status**: ❌ Not Started
**Priority**: ⚡ High
```
Required:
- [ ] Create MSI/NSIS installer
- [ ] Auto-create F:\Win Count by ArtYWoof
- [ ] Desktop shortcut creation
- [ ] Start menu entry
- [ ] Uninstaller
- [ ] Version information
```

### 6. 🔒 CODE PROTECTION
**Status**: ❌ Not Started  
**Priority**: ⚡ High
```
Required:
- [ ] Code obfuscation
- [ ] License verification
- [ ] Hardware fingerprinting
- [ ] Anti-tampering
- [ ] Digital signature
```

### 7. 📋 ZIP PACKAGE FOR SALES
**Status**: ❌ Not Started
**Priority**: ⚡ High
```
Required:
- [ ] Build release version
- [ ] Create portable version
- [ ] Include documentation
- [ ] License agreement
- [ ] README for customers
```

---

## 🎯 IMMEDIATE ACTION PLAN

### Week 1: Core Missing Features
**Day 1-2: Audio Settings**
```bash
1. Enable Settings Modal (currently disabled)
2. Create Audio tab in settings
3. Add mute/unmute toggle
4. Add file upload for custom sounds
5. Add volume controls
```

**Day 3-4: Hotkey Customization**
```bash
1. Create Hotkey tab in settings
2. Add key binding interface
3. Implement conflict detection
4. Add save/reset functions
5. Update backend hotkey registration
```

**Day 5: Preset Name Editing**
```bash
1. Make preset name editable in main UI
2. Add auto-save on blur/enter
3. Add validation for duplicate names
4. Add error handling
```

### Week 2: Distribution Preparation
**Day 1-3: Enhanced Animations**
```bash
1. Improve overlay number transitions
2. Add color-coded animations
3. Add glow effects
4. Test performance
```

**Day 4-5: Installation Package**
```bash
1. Setup Tauri bundle configuration
2. Create installer script
3. Test installation process
4. Add uninstaller
```

**Day 6-7: Code Protection & Sales Package**
```bash
1. Implement basic protection
2. Create release build
3. Package for distribution
4. Test complete package
```

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### Settings Modal Re-enabling
```typescript
// Currently disabled in +page.svelte
let showSettingsModal = false; // Change this to work
// Need to create proper settings component
```

### Audio System Architecture
```
Frontend: Svelte Audio Manager
├── Mute/Unmute state
├── Volume control
├── Custom sound upload
└── Sound preview

Backend: Tauri Audio Commands
├── Save audio preferences
├── Handle file uploads
├── Audio file validation
└── Sound playback controls
```

### Hotkey System Enhancement
```
Current: Fixed hotkeys in Rust
Required: Dynamic hotkey system
├── Frontend hotkey UI
├── Backend hotkey registration
├── Conflict detection
└── Persistent storage
```

---

## 🎯 SUCCESS CRITERIA

### Must Have (ไม่มีไม่ขาย)
- [x] ✅ Core win counting functionality
- [x] ✅ Real-time overlay sync
- [x] ✅ Basic preset system
- [ ] ❌ Audio settings (mute, custom sounds)
- [ ] ❌ Hotkey customization
- [ ] ❌ Installation package
- [ ] ❌ Code protection

### Should Have (ควรมี)
- [ ] Enhanced overlay animations
- [ ] Preset name direct editing
- [ ] Better error handling
- [ ] Performance optimization

### Nice to Have (ดีถ้ามี)
- [ ] Theme customization
- [ ] Multi-language support
- [ ] Cloud sync presets
- [ ] Advanced statistics

---

## 📞 QUESTIONS TO CLARIFY

1. **Audio System**: ต้องการ volume control หรือแค่ mute/unmute?
2. **Hotkey Customization**: ต้องการ modifier keys อะไรบ้าง? (Ctrl, Alt, Shift, Win)
3. **Installation**: ต้องการ auto-update feature ไหม?
4. **Protection**: ต้องการ license system ระดับไหน? (simple/advanced)
5. **Overlay**: ต้องการ animation แบบไหน? (fade, slide, bounce, scale)

---

*Priority Legend:*
- 🔥 **CRITICAL**: ต้องมีก่อนขาย
- ⚡ **HIGH**: สำคัญมาก ควรมี  
- 📋 **MEDIUM**: ดีถ้ามี ไม่มีก็ได้

*Last Updated: July 3, 2025*
