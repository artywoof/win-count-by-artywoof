# 🎯 การทดสอบการแก้ไข Hotkey System

## 🔧 การแก้ไขที่ทำไปแล้ว

### 1. **แก้ไข Window Focus Check**
- ✅ แยก Local Hotkeys และ Global Hotkeys
- ✅ Local Hotkeys ทำงานเมื่อ window focus (เว้นแต่ input field focus)
- ✅ Global Hotkeys ทำงานเมื่อ window ไม่ focus

### 2. **ปรับปรุง Win Input Field**
- ✅ เพิ่ม Debug Logging สำหรับ focus/blur/change/input
- ✅ เพิ่ม title และ placeholder
- ✅ ปรับปรุง tabindex และ accessibility

### 3. **เพิ่ม Detailed Registration Logging**
- ✅ แสดงผลการ register แต่ละ shortcut แยกชัด
- ✅ นับสถิติ success/failed
- ✅ แสดงเหตุผลที่ registration ล้มเหลว

### 4. **ปรับปรุง F-Key Support และ Logging**
- ✅ เพิ่ม F-key detection ใน Rust backend
- ✅ แสดงคำแนะนำเมื่อ F-key registration ล้มเหลว
- ✅ เพิ่ม debug commands เฉพาะ F-keys

## 🧪 คำสั่งทดสอบใหม่

### เปิด Browser Console และรันคำสั่งเหล่านี้:

```javascript
// 1. ทดสอบ Window Focus Logic
debugHotkeys.state()  // ดู window focus status

// 2. ทดสอบ F-Key Support
debugHotkeys.testFKey("F1")      // ทดสอบ F1 เฉพาะ
debugHotkeys.testAllFKeys()      // ทดสอบ F1-F4 ทั้งหมด

// 3. ทดสอบ Key Normalization
debugHotkeys.normalizeTest("Alt+Shift+=")    // ควรได้ "Alt+Shift+Equal"
debugHotkeys.normalizeTest("Alt+Shift+Plus") // ควรได้ "Alt+Shift+Equal"

// 4. ทดสอบ Registration Detailed Logging
debugHotkeys.test()              // ดู detailed registration logs

// 5. ทดสอบ Input Field Detection
// คลิกที่ Win Count input และรัน:
debugHotkeys.shortcuts()         // ตอน input focus ควรเห็น log ว่า hotkey disabled

// 6. ทดสอบ Alt+Shift+Minus/Equal
debugHotkeys.testKey("Alt+Shift+Equal")   // ควร map ไป increment10
debugHotkeys.testKey("Alt+Shift+Minus")   // ควร map ไป decrement10
```

## 🎯 สิ่งที่ควรเห็นหลังการแก้ไข

### ✅ **Local Hotkeys ทำงานเมื่อ Window Focus**
```
🔥 [FRONTEND] Received hotkey event: increment10, source: local
✅ [FRONTEND] Executing hotkey action: increment10
📊 [FRONTEND] Calling winChangeCallback with amount: 10
```

### ✅ **Win Input พิมพ์ได้**
```
🎯 [INPUT] Win input focused
🎯 [INPUT] Win input typing: 42 (parsed: 42)
🎯 [INPUT] Win input changed: 0 → 42
```

### ✅ **Registration Logging ละเอียด**
```
🔧 [FRONTEND] ➤ Registering: Alt+Shift+Equal → increment10
✅ [FRONTEND] ✓ SUCCESS: Alt+Shift+Equal → increment10
📊 [FRONTEND] Registration Summary: 4 success, 0 failed out of 4 total
```

### ✅ **F-Key Error Messages**
```
❌ [RUST] ✗ FAILED: Failed to register shortcut F1: permission denied
⚠️ [RUST] F-key registration failed: F1 - This may be due to:
   • OS-level restrictions on function keys
   • Another application using this F-key
   • System security settings blocking global F-key shortcuts
💡 [RUST] Suggestion: Try using Alt+F1 instead of F1 for more reliable registration
```

## 🎮 การทดสอบ Hotkey จริง

### ทดสอบ Alt+Shift+ Combinations:
1. **กด Alt+Shift+=** → ควรเพิ่ม 10
2. **กด Alt+Shift+-** → ควรลด 10
3. **ดู console logs** → ควรเห็น `source: local` เมื่อ window focus

### ทดสอบ Input Protection:
1. **คลิกที่ Win Count input**
2. **กด Alt+Equal** → ควรไม่ทำงาน (input focused)
3. **คลิกข้างนอก** 
4. **กด Alt+Equal** → ควรทำงาน

### ทดสอบ F-Keys:
1. **รัน** `debugHotkeys.mapToF()`
2. **กด F1/F2/F3/F4** → อาจไม่ทำงานถ้า OS block
3. **ดู logs** → ควรเห็นคำแนะนำการแก้ไข

## 📋 Checklist การทดสอบ

- [ ] Alt+Shift+= เพิ่ม 10 (ไม่ใช่ ignore)
- [ ] Alt+Shift+- ลด 10 (ไม่ใช่ ignore)  
- [ ] Win input ช่องพิมพ์ได้
- [ ] F-key registration แสดง error message ที่มีประโยชน์
- [ ] Registration logs แสดงรายละเอียด success/failed
- [ ] Window focus logic ทำงานถูกต้อง
- [ ] Input field focus ป้องกัน hotkey ได้

หากทุกข้อผ่าน = การแก้ไขสำเร็จ! 🎉
