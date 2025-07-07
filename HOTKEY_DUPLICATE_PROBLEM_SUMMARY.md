# 🔥 HOTKEY DUPLICATE EVENTS PROBLEM SUMMARY

## ปัญหาหลัก
- **กด Alt+= ครั้งเดียวเร็วๆ → ตัวเลขเปลี่ยน 2-3 ครั้ง**
- **Tauri global_shortcut_manager ส่ง duplicate events**
- **ต้องการ: กดครั้งเดียว = เปลี่ยนครั้งเดียว**
- **ต้องการ: กดค้าง = auto-repeat ต่อเนื่อง**

## สิ่งที่ลองแล้ว (ไม่ได้ผล)
1. ✗ Frontend debounce (150ms, 200ms, 300ms, 500ms)
2. ✗ State machine (idle → pressed → repeating)
3. ✗ Action cooldown + event debounce
4. ✗ Rust-side debounce 800ms (ช้าเกินไป, ตอบสนองไม่ทัน)

## แนวทางที่ควรลองต่อ

### 1. 🎯 **ใช้ tauri-plugin-global-shortcut (แนะนำสุด)**
```rust
// ใน Cargo.toml
tauri-plugin-global-shortcut = { version = "2", features = ["pressed-released"] }

// ใน main.rs
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

app.global_shortcut()
    .on_shortcut("Alt+Equal", |app, shortcut, event| {
        match event.state {
            ShortcutState::Pressed => {
                // เมื่อกดลง - ทำ action ทันที
                app.emit_all("hotkey-increment-pressed", ()).unwrap();
            }
            ShortcutState::Released => {
                // เมื่อปล่อย - หยุด auto-repeat
                app.emit_all("hotkey-increment-released", ()).unwrap();
            }
        }
    })?;
```

```javascript
// ใน Svelte
await listen('hotkey-increment-pressed', () => {
    increaseWin(1); // ทำ action ทันที
    startAutoRepeat('increment');
});

await listen('hotkey-increment-released', () => {
    stopAutoRepeat('increment'); // หยุด auto-repeat
});
```

### 2. 🔧 **Rust-side Event Deduplication**
```rust
// เพิ่มใน main.rs
use std::sync::Mutex;
use std::collections::HashMap;

struct EventDeduplicator {
    last_events: Mutex<HashMap<String, (u64, bool)>>, // (timestamp, processed)
}

const DUPLICATE_WINDOW_MS: u64 = 50; // หน้าต่างเวลาสำหรับ duplicate detection

fn should_process_event(dedup: &EventDeduplicator, event_id: &str) -> bool {
    let mut events = dedup.last_events.lock().unwrap();
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
    
    if let Some((last_time, processed)) = events.get(event_id) {
        if now - last_time < DUPLICATE_WINDOW_MS {
            if *processed {
                return false; // Already processed this event
            }
        }
    }
    
    events.insert(event_id.to_string(), (now, true));
    true
}
```

### 3. ⚡ **Fast Debounce + Smart Auto-repeat**
```rust
// ลด debounce เป็น 100ms แต่เพิ่ม smart logic
const HOTKEY_DEBOUNCE_MS: u64 = 100;
const QUICK_PRESS_THRESHOLD: u64 = 200;

// Track event patterns
struct EventPattern {
    first_event: u64,
    event_count: u32,
}

// ถ้า events มา 2 ครั้งภายใน 200ms = single press
// ถ้า events มาต่อเนื่อง = hold press
```

### 4. 🎮 **Alternative: Raw Input Handling**
```rust
// ใช้ OS-specific raw input แทน global shortcut
#[cfg(windows)]
use winapi::um::winuser::{RegisterHotKey, UnregisterHotKey};

// Register hotkey ที่ OS level
// Handle WM_HOTKEY messages directly
// แยก key down/up ได้แม่นยำ
```

### 5. 📱 **Hybrid Approach**
```javascript
// Frontend: ใช้ timing pattern detection
let keyEventPattern = [];

function detectEventPattern(key) {
    const now = Date.now();
    keyEventPattern.push(now);
    
    // Keep only last 3 events
    if (keyEventPattern.length > 3) {
        keyEventPattern.shift();
    }
    
    // Analyze pattern
    if (keyEventPattern.length >= 2) {
        const gap = keyEventPattern[1] - keyEventPattern[0];
        
        if (gap < 100) {
            // Rapid events = single press (ignore second)
            if (keyEventPattern.length === 2) {
                return 'single_press';
            } else {
                return 'ignore';
            }
        } else {
            // Spaced events = hold press
            return 'hold_press';
        }
    }
    
    return 'first_event';
}
```

## ลำดับความสำคัญในการแก้ไข

### 🥇 **Priority 1: tauri-plugin-global-shortcut**
- แก้ปัญหาที่ root cause
- รองรับ pressed/released events
- Performance ดีที่สุด

### 🥈 **Priority 2: Event Deduplication ใน Rust**
- เก็บ global shortcut เดิม
- เพิ่ม smart deduplication
- ปรับ debounce เป็น 50-100ms

### 🥉 **Priority 3: Pattern Detection ใน Frontend**
- วิเคราะห์ timing pattern
- แยกแยะ single press vs hold
- Fallback solution

## สิ่งที่ต้องทดสอบ
1. **กด Alt+= เร็วๆ 1 ครั้ง** → +1 เท่านั้น
2. **กด Alt+= ค้าง** → +1 ทันที, แล้ว auto-repeat
3. **กด Alt+= เร็วติดๆ** → แต่ละครั้งได้ +1 (ไม่ควรมี lag)
4. **ปล่อยปุ่มระหว่าง auto-repeat** → หยุดทันที

## Files ที่เกี่ยวข้อง
- `src-tauri/src/main.rs` - Rust backend
- `src/routes/+page.svelte` - Frontend hotkey handling
- `src-tauri/Cargo.toml` - Dependencies

## Note
- ปัญหาหลักอยู่ที่ Tauri global_shortcut_manager
- การแก้ที่ frontend เพียงอย่างเดียวไม่เพียงพอ
- ต้องแก้ที่ source (Rust) หรือเปลี่ยน approach

---
*สร้างเมื่อ: 2025-07-05*
*สถานะ: รอการแก้ไขต่อ*
