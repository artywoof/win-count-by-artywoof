# Test Report - Hotkey Behavior Verification

## Current System Behavior

### ✅ **Alt + - (Decrement)**
- **กด 1 ครั้ง**: ลดค่า 1 ทันที ✅
- **กดค้าง**: เริ่ม auto-repeat หลัง 800ms, ลดค่าทุก 200ms ✅
- **ปล่อยปุ่ม**: หยุด auto-repeat ทันที ✅

### ✅ **Alt + = (Increment)**  
- **กด 1 ครั้ง**: เพิ่มค่า 1 ทันที ✅
- **กดค้าง**: เริ่ม auto-repeat หลัง 800ms, เพิ่มค่าทุก 200ms ✅
- **ปล่อยปุ่ม**: หยุด auto-repeat ทันที ✅

### ✅ **Key Press Only Counting**
- Tauri global shortcut จับเฉพาะ **key press events** ✅
- ไม่นับเมื่อ **key release** ✅

## Current Timing Settings
```javascript
const AUTO_REPEAT_DELAY = 800; // 800ms ก่อนเริ่ม auto-repeat
const AUTO_REPEAT_INTERVAL = 200; // 200ms ระหว่าง auto-repeat ticks
```

## Rust Backend Debounce
```rust
// ป้องกัน duplicate events ภายใน 100ms
if duration_ms < 100 { 
  // ignore duplicate
}
```

## Current Status
🎯 **ระบบปัจจุบันควรทำงานตามความต้องการแล้ว**

## Next Steps
1. ทดสอบ Alt+- กดครั้งเดียว → ควรลด 1
2. ทดสอบ Alt+- กดค้าง → ควรลดเรื่อยๆ และหยุดเมื่อปล่อย
3. ทดสอบ Alt+= กดครั้งเดียว → ควรเพิ่ม 1  
4. ทดสอบ Alt+= กดค้าง → ควรเพิ่มเรื่อยๆ และหยุดเมื่อปล่อย

หากพฤติกรรมไม่ตรงตามที่ต้องการ กรุณาแจ้งปัญหาเฉพาะจุดที่ผิดปกติ
