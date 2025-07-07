# TODO List สำหรับพรุ่งนี้ 🌅

## 🔥 Priority 1: ทดสอบระบบที่เพิ่งทำเสร็จ

### 1. ทดสอบ Hotkey System
```bash
# เปิดแอป และทดสอบ:
npm run dev

# ทดสอบ Global Shortcuts (เมื่อแอปไม่ focus):
# Alt + = (increment)
# Alt + - (decrement) 
# Alt + Shift + = (increment 10)
# Alt + Shift + - (decrement 10)

# ทดสอบ Local Hotkeys (เมื่อแอป focus):
# เดียวกับข้างบน แต่เมื่อ focus ที่แอป

# ตรวจสอบ Console Logs:
# - ควรเห็นข้อความ "Window focused/unfocused"
# - ควรเห็น "Global hotkey ignored: window is focused"
# - ควรเห็น throttling messages
```

### 2. ทดสอบ Audio System  
```bash
# ดู Console Logs ขณะกด hotkeys:
# - ควรเห็น "🔊 Calling audioManager.play() for increase/decrease"
# - ตอนนี้ใช้ default sounds (beep) อยู่

# ทดสอบ Audio Failure:
# - ปิดเสียงระบบ (mute)
# - ควรเห็น toast notification สีแดง
# - ควรเห็น "🚨 AUDIO FAILURE" ใน console
```

### 3. ทดสอบ Input Field Protection
```bash
# เปิด Settings Modal
# พิมพ์ในช่อง text input
# กด Alt + = ขณะ focus ใน input
# ควรไม่ trigger hotkey และเห็น "Input field is focused" ใน console
```

---

## 🔧 Priority 2: ปรับแต่งรายละเอียด

### 1. เปลี่ยนกลับไปใช้ Custom Sounds
```javascript
// ใน +page.svelte หา:
const success = await audioManager.play(soundType, true); // Force default

// เปลี่ยนเป็น:
const success = await audioManager.play(soundType, false); // Allow custom
// หรือ
const success = await audioManager.play(soundType); // Default behavior
```

### 2. ปรับแต่ง Toast Notification (ถ้าต้องการ)
```javascript
// ใน showAudioFailureToast() สามารถปรับ:
// - สี background
// - ตำแหน่ง (ตอนนี้ top-right)
// - ระยะเวลาแสดง (ตอนนี้ 3 วินาที)
// - ข้อความ
```

### 3. เพิ่ม Hotkey Settings ใน Settings Modal (Optional)
```javascript
// เพิ่มใน SettingsModal.svelte:
// - Tab สำหรับ Hotkey Settings
// - เปิด/ปิด hotkeys
// - แก้ไข key combinations
// - ทดสอบ hotkeys
```

---

## 🐛 Priority 3: แก้ไข Warnings (ถ้าอยากได้ clean build)

### 1. แก้ A11Y Warnings
```svelte
<!-- Toggle buttons ต้องมี aria-label -->
<button 
  class="toggle-switch"
  aria-label="Toggle crown visibility"
  ...
>

<!-- Modal ต้องมี tabindex -->
<div role="dialog" tabindex="-1" ...>
```

### 2. ลบ Unused CSS
```css
/* ลบ body selector ที่ไม่ได้ใช้ */
/* body { ... } */
```

---

## 🚀 Priority 4: Performance & Polish

### 1. ทดสอบ Memory Leaks
```javascript
// ตรวจสอบว่า event listeners ถูก cleanup
// ตรวจสอบ timeout/interval cleanup
// ทดสอบเปิด-ปิดแอปหลายรอบ
```

### 2. ทดสอบกับ Tauri
```bash
# Build Tauri app
npm run tauri build

# ทดสอบ global shortcuts ใน production build
# ทดสอบ system tray functionality
# ทดสอบ window management
```

---

## 📋 Quick Commands สำหรับพรุ่งนี้

```bash
# Start development
cd "f:\win-count-by-artywoof"
npm run dev

# Build และทดสอบ
npm run build

# Build Tauri (ถ้าต้องการ)
npm run tauri build

# ดู logs
# เปิด DevTools ใน browser (F12)
# ดู Console tab
```

---

## 🎯 Expected Results

### สิ่งที่ควรเห็นเมื่อทำงานถูกต้อง:
1. **Hotkeys ไม่ duplicate** - กดครั้งเดียวได้ผลครั้งเดียว
2. **Audio มี debug logs** - เห็น "Calling audioManager.play()" ทุกครั้ง
3. **Error feedback** - เมื่อ audio ล้มเหลวมี toast แจ้งเตือน
4. **Input protection** - hotkeys ไม่ทำงานเมื่อพิมพ์ใน input fields
5. **Focus awareness** - global/local hotkeys ทำงานตาม context

### ถ้าเจอปัญหา:
- ดู Console Logs เป็นอันดับแรก
- ตรวจสอบ Browser DevTools
- ตรวจสอบไฟล์ `WORK_PROGRESS_SUMMARY.md` สำหรับรายละเอียด

---

## 💡 Notes

- **Default Sounds**: ตอนนี้ force ใช้ default beep sounds เพื่อทดสอบ
- **Custom Sounds**: จะเปิดใช้หลังจากทดสอบ default sounds เสร็จ
- **Tauri**: Global shortcuts อาจต้องทดสอบใน production build
- **Performance**: ระบบ throttling และ debouncing ควรทำให้ smooth ขึ้น

**พรุ่งนี้มาทดสอบกันต่อครับ! 🚀**
