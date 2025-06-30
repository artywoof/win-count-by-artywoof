# Manual Testing Checklist

## Issues to Verify Are Fixed:

### ✅ 1. Win Count Input - Multi-digit Numbers
- [ ] Open main app at http://localhost:1420
- [ ] Click on win count input field  
- [ ] Type "25" and verify it shows "25" (not just "5")
- [ ] Type "123" and verify it shows "123"

### ✅ 2. Negative Number Input  
- [ ] Click on win count input field
- [ ] Type "-25" and verify it shows "-25"
- [ ] Press Enter/Tab to confirm and verify it accepts negative numbers

### ✅ 3. Hotkeys (Alt + = / Alt + -)
- [ ] Make sure no input fields are focused
- [ ] Press Alt + = and verify win count increases
- [ ] Press Alt + - and verify win count decreases
- [ ] Check console logs for hotkey detection messages

### ✅ 4. Hotkey Compatibility (Thai/English keyboard)
- [ ] Test with different keyboard layouts
- [ ] Verify hotkeys work with keyCode, key, and code detection

### ✅ 5. Goal Input Sync
- [ ] Open overlay at http://localhost:1420/overlay
- [ ] In main app, change the goal value
- [ ] Verify overlay updates immediately with new goal

### ✅ 6. Toggle Crown / Goal Visibility  
- [ ] Toggle crown visibility in main app
- [ ] Verify overlay crown appears/disappears
- [ ] Toggle goal visibility in main app  
- [ ] Verify overlay goal appears/disappears

### ✅ 7. Overall Overlay Responsiveness
- [ ] Verify overlay responds to all changes from main app
- [ ] Check WebSocket connection logs in terminal
- [ ] Verify BroadcastChannel messages in browser console

## Testing Status:
Currently testing manually via browser windows.
