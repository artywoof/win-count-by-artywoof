# 🚀 NEXT STEPS FOR HOTKEY FIX

## วันพรุ่งนี้ควรทำ

### Step 1: ลอง tauri-plugin-global-shortcut แบบ pressed/released
```bash
# 1. ตรวจสอบว่า plugin รองรับ pressed/released หรือไม่
# 2. ถ้าไม่รองรับ → ไป Step 2
```

### Step 2: ใช้ Event Deduplication ใน Rust
```rust
// เพิ่มใน main.rs หลัง line 25
pub struct EventDeduplicator {
    last_events: Mutex<HashMap<String, u64>>,
}

const DUPLICATE_WINDOW_MS: u64 = 50;

fn is_duplicate_event(dedup: &EventDeduplicator, event_id: &str) -> bool {
    let mut events = dedup.last_events.lock().unwrap();
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
    
    if let Some(last_time) = events.get(event_id) {
        if now - last_time < DUPLICATE_WINDOW_MS {
            return true; // This is a duplicate
        }
    }
    
    events.insert(event_id.to_string(), now);
    false
}

// เปลี่ยน HOTKEY_DEBOUNCE_MS กลับเป็น 100
const HOTKEY_DEBOUNCE_MS: u64 = 100;

// ใน shortcut handler เพิ่ม
if is_duplicate_event(&dedup_state, "increment_win") {
    println!("🔇 [RUST] Duplicate event filtered");
    return;
}
```

### Step 3: ปรับ Frontend ให้เร็วขึ้น
```javascript
// ลบ complex state machine
// ใช้ simple approach:

function handleHotkey(key, action) {
    // Clear existing auto-repeat
    clearAutoRepeat(key);
    
    // Do action immediately (Rust already handled debounce)
    action();
    
    // Start auto-repeat after 400ms
    setTimeout(() => startAutoRepeat(key, action), 400);
}
```

## การทดสอบ

### Test Case 1: Single Press
```
Action: กด Alt+= เร็วๆ แล้วปล่อย
Expected: ตัวเลขเพิ่ม +1 เท่านั้น
Current: ตัวเลขเพิ่ม +2 หรือ +3
```

### Test Case 2: Hold Press  
```
Action: กด Alt+= ค้างไว้ 2 วินาที
Expected: +1 ทันที, แล้ว auto-repeat ทุก 100ms หลัง 400ms
Current: ทำงานปกติ (ถ้า single press แก้แล้ว)
```

### Test Case 3: Rapid Presses
```
Action: กด Alt+= เร็วๆ 5 ครั้งติดๆ
Expected: ได้ +5 (แต่ละครั้งตอบสนองเร็ว)
Current: อาจ lag หรือนับไม่ครบ
```

## Files ที่ต้องแก้

### 1. `src-tauri/src/main.rs`
- เพิ่ม EventDeduplicator struct
- เพิ่ม is_duplicate_event function
- เปลี่ยน HOTKEY_DEBOUNCE_MS เป็น 100
- เพิ่ม duplicate check ใน shortcut handlers

### 2. `src/routes/+page.svelte`  
- ลบ state machine logic ที่ซับซ้อน
- ใช้ simple handleHotkey function
- ลด auto-repeat delay เป็น 400ms

### 3. (Optional) `src-tauri/Cargo.toml`
- อัพเดท tauri-plugin-global-shortcut ถ้าจำเป็น

## Backup Plan

ถ้าวิธีข้างบนไม่ได้ผล:

### Plan B: Pattern Detection
```javascript
// ใน Svelte
let eventTimes = [];

function analyzeEventPattern() {
    const now = Date.now();
    eventTimes.push(now);
    
    if (eventTimes.length > 2) eventTimes.shift();
    
    if (eventTimes.length === 2) {
        const gap = eventTimes[1] - eventTimes[0];
        
        if (gap < 100) {
            return 'duplicate'; // Ignore
        } else if (gap < 300) {
            return 'release'; // Ignore  
        } else {
            return 'new_press'; // Process
        }
    }
    
    return 'first_press'; // Process
}
```

### Plan C: OS-specific Solution
- Windows: ใช้ RegisterHotKey API
- มี key down/up events แยกชัด
- ซับซ้อนกว่า แต่แม่นยำที่สุด

---
*พร้อมสำหรับวันพรุ่งนี้ 🌅*
