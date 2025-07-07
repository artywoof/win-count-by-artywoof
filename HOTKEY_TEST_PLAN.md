# 🔧 Hotkey Fix Testing Plan

## Test the Fixed Issues

### 1. **Alt+Shift+= Key Normalization Test**
```javascript
// In browser console:
debugHotkeys.normalizeTest("Alt+Shift+=")    // Should show: Alt+Shift+Equal
debugHotkeys.normalizeTest("Alt+Shift+Plus") // Should show: Alt+Shift+Equal
debugHotkeys.testKey("Alt+Shift+Equal")      // Should map to increment10
```

### 2. **F-Key Support Test**
```javascript
// Test F-key validation and mapping:
debugHotkeys.validateKey("F1")              // Should show: supported
debugHotkeys.changeMap("increment", "F1")   // Map increment to F1
debugHotkeys.testKey("F1")                  // Should map to increment
// Then press F1 key - should trigger increment action
```

### 3. **Backend Key Support Test**
```javascript
// Test various key combinations:
debugHotkeys.validateKey("Alt+1")           // Check if supported
debugHotkeys.validateKey("Alt+Shift+Minus") // Should be supported
debugHotkeys.validateKey("A")               // Should show: not supported
```

### 4. **Key Detection Test (Event.code vs Event.key)**
```javascript
// Map to test Alt+Shift combinations:
debugHotkeys.changeMap("increment10", "Alt+Shift+Equal")
debugHotkeys.shortcuts()                    // Verify mapping
// Then press Alt+Shift+= (should trigger increment10 even though key shows as "+")
```

### 5. **Local vs Global Hotkey Test**
```javascript
debugHotkeys.state()                        // Check window focus status
// Press hotkeys when window is focused vs unfocused
// Should work in both cases without duplication
```

## Expected Results After Fixes:

✅ **Alt+Shift+= properly triggers increment10** (normalized to Alt+Shift+Equal)
✅ **F1/F2/F3/F4 keys work when assigned** (backend supports F-keys)
✅ **Alt+Shift+- triggers decrement10** (no more "ignored when focused" issues)
✅ **Unsupported keys show warnings** (Alt+1 validation feedback)
✅ **Key normalization works** (Plus/Equal treated as same, proper event.code usage)

## Debug Commands Available:
- `debugHotkeys.help()` - Show all available commands
- `debugHotkeys.shortcuts()` - Show current mappings
- `debugHotkeys.settings()` - Show hotkey settings
- `debugHotkeys.validateKey(key)` - Check if key is supported
- `debugHotkeys.normalizeTest(key)` - Test key normalization
- `debugHotkeys.testKey(key)` - Test if key maps to any action
- `debugHotkeys.changeMap(action, key)` - Change key mapping
- `debugHotkeys.mapToF()` - Quick map to F1-F4
- `debugHotkeys.reset()` - Reset to default Alt+... keys

## Test Flow:
1. Open browser console in Tauri app
2. Run `debugHotkeys.help()` to see available commands
3. Test each issue scenario above
4. Verify hotkeys work both globally and locally
5. Check validation warnings for unsupported keys
