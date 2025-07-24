<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { invoke } from '@tauri-apps/api/core';

  // State stores - these will be updated by Tauri events
  const win = writable(0);
  const goal = writable(10);
  const showGoal = writable(true);
  const showCrown = writable(true);
  const presets = writable<string[]>([]);
  const currentPreset = writable('Default');

  // Overlay state - separate from app state
  const overlayShowGoal = writable(true);
  const overlayShowCrown = writable(true);

  // App display state - always show in main app
  const appShowCrown = writable(true);
  const appShowGoal = writable(true);

  // UI state
  let showSettingsModal = false;
  let showPresetModal = false;
  let settingsTab = 'hotkey'; // 'hotkey' or 'sound'
  
  // Preset editing state
  let editingPreset = null;
  let newPresetName = '';

  // Settings state
  let customHotkeys: Record<string, string> = {
    increment: 'Alt+=',
    decrement: 'Alt+-',
    increment10: 'Alt+Shift+=',
    decrement10: 'Alt+Shift+-'
  };
  let soundEnabled = true;
  let customIncreaseSound: string | null = null;
  let customDecreaseSound: string | null = null;
  let audioUpCustom: HTMLAudioElement | null = null;
  let audioDownCustom: HTMLAudioElement | null = null;
  
  // Hotkey recording state
  let recordingHotkey: string | null = null;
  let recordingTimeout: number | null = null;

  // Number editing state
  let editingWin = false;
  let editingGoal = false;
  let winEditValue = '';
  let goalEditValue = '';
  let winInputElement: HTMLInputElement;
  let goalInputElement: HTMLInputElement;

  let tauriAvailable = false;
  let unlisten: UnlistenFn | null = null;
  let audioUp: HTMLAudioElement;
  let audioDown: HTMLAudioElement;

  let overlayWebSocket: WebSocket | null = null;

  // Initialize Tauri connection and load initial state
  async function initializeTauri() {
    if (!browser) return;
    
    try {
      // Load initial state from Tauri
      const state = await invoke('get_win_state') as any;
      console.log('🎯 Loaded initial state from Tauri:', state);
      
      win.set(state.win || 0);
      goal.set(state.goal || 10);
      showGoal.set(state.show_goal !== false);
      showCrown.set(state.show_crown !== false);
      
      tauriAvailable = true;
      
      // Listen for state updates from Tauri
      unlisten = await listen('state-updated', (event) => {
        console.log('🎯 Received state update from Tauri:', event.payload);
        const state = event.payload as any;
        win.set(state.win || 0);
        goal.set(state.goal || 10);
        showGoal.set(state.show_goal !== false);
        showCrown.set(state.show_crown !== false);
        
        // Send the update to overlay with overlay-specific state
        sendToOverlay({
          win: state.win || 0,
          goal: state.goal || 10,
          show_crown: $overlayShowCrown,
          show_goal: $overlayShowGoal,
          current_preset: state.current_preset || 'Default'
        });
      });
      
      // Listen for sound events from Rust backend
      const unlistenIncreaseSound = await listen('play-increase-sound', () => {
        console.log('🔊 Received play-increase-sound event from Rust');
        playIncreaseSound();
      });
      
      const unlistenDecreaseSound = await listen('play-decrease-sound', () => {
        console.log('🔊 Received play-decrease-sound event from Rust');
        playDecreaseSound();
      });
      
      // Store all unlisten functions for cleanup
      const originalUnlisten = unlisten;
      unlisten = () => {
        originalUnlisten?.();
        unlistenIncreaseSound?.();
        unlistenDecreaseSound?.();
      };
      
      // NOTE: Hotkey events are handled directly by Rust backend
      // No need to listen for hotkey events here since Rust calls change_win() directly
      // and emits 'state-updated' events that we already listen to above
      
      console.log('✅ Tauri connection established');
    } catch (err) {
      console.error('❌ Failed to initialize Tauri:', err);
      tauriAvailable = false;
    }
  }

  function initOverlayWebSocket() {
    try {
      overlayWebSocket = new WebSocket('ws://localhost:779');
      overlayWebSocket.onopen = () => {
        console.log('🔗 WebSocket connected to overlay bridge');
        // Send current state immediately
        sendToOverlay({
          win: $win,
          goal: $goal,
          show_crown: $overlayShowCrown,
          show_goal: $overlayShowGoal,
          current_preset: $currentPreset
        });
      };
      overlayWebSocket.onclose = () => {
        console.log('🔗 WebSocket disconnected from overlay bridge');
        setTimeout(() => {
          if (browser) {
            initOverlayWebSocket();
          }
        }, 3000);
      };
      overlayWebSocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    } catch (err) {
      console.error('❌ Failed to initialize WebSocket:', err);
    }
  }

  function sendToOverlay(state: any) {
    // Send via WebSocket to bridge server (for cross-process communication)
    if (overlayWebSocket && overlayWebSocket.readyState === WebSocket.OPEN) {
      overlayWebSocket.send(JSON.stringify({
        type: 'update',
        ...state
      }));
      console.log('🔗 Sent state to overlay bridge:', state);
    }
  }

  // Sound functions
  function playIncreaseSound() {
    console.log('🔊 playIncreaseSound called - soundEnabled:', soundEnabled, 'audioUp:', !!audioUp, 'audioUpCustom:', !!audioUpCustom);
    if (soundEnabled) {
      if (audioUpCustom) {
        console.log('🔊 Playing custom increase sound');
        audioUpCustom.currentTime = 0;
        audioUpCustom.play().catch(err => console.error('🔊 Error playing custom increase sound:', err));
      } else if (audioUp) {
        console.log('🔊 Playing default increase sound');
        audioUp.currentTime = 0;
        audioUp.play().catch(err => console.error('🔊 Error playing default increase sound:', err));
      } else {
        console.warn('🔊 No audio element available for increase sound');
      }
    } else {
      console.log('🔊 Sound is disabled');
    }
  }

  function playDecreaseSound() {
    console.log('🔊 playDecreaseSound called - soundEnabled:', soundEnabled, 'audioDown:', !!audioDown, 'audioDownCustom:', !!audioDownCustom);
    if (soundEnabled) {
      if (audioDownCustom) {
        console.log('🔊 Playing custom decrease sound');
        audioDownCustom.currentTime = 0;
        audioDownCustom.play().catch(err => console.error('🔊 Error playing custom decrease sound:', err));
      } else if (audioDown) {
        console.log('🔊 Playing default decrease sound');
        audioDown.currentTime = 0;
        audioDown.play().catch(err => console.error('🔊 Error playing default decrease sound:', err));
      } else {
        console.warn('🔊 No audio element available for decrease sound');
      }
    } else {
      console.log('🔊 Sound is disabled');
    }
  }

  // Main win count functions
  async function increaseWin(amount: number = 1) {
    const newValue = Math.min(10000, $win + amount);
    if (newValue !== $win) {
      await tauriSetWin(newValue);
      playIncreaseSound();
    }
  }

  async function decreaseWin(amount: number = 1) {
    const newValue = Math.max(-10000, $win - amount);
    if (newValue !== $win) {
      await tauriSetWin(newValue);
      playDecreaseSound();
    }
  }

  // Tauri command wrappers
  async function tauriSetWin(value: number) {
    if (!tauriAvailable) return;
    try {
      const clampedValue = Math.max(-10000, Math.min(10000, value));
      await invoke('set_win', { value: clampedValue });
      console.log('🎯 Win set via Tauri:', clampedValue);
    } catch (err) {
      console.error('❌ Failed to set win:', err);
    }
  }

  async function tauriSetGoal(value: number) {
    if (!tauriAvailable) return;
    try {
      const clampedValue = Math.max(-10000, Math.min(10000, value));
      await invoke('set_goal', { value: clampedValue });
      console.log('🎯 Goal set via Tauri:', clampedValue);
    } catch (err) {
      console.error('❌ Failed to set goal:', err);
    }
  }

  async function tauriToggleGoal() {
    if (!tauriAvailable) return;
    try {
      await invoke('toggle_goal_visibility');
      console.log('🎯 Goal visibility toggled via Tauri');
    } catch (err) {
      console.error('❌ Failed to toggle goal visibility:', err);
    }
  }

  async function tauriToggleCrown() {
    if (!tauriAvailable) return;
    try {
      await invoke('toggle_crown_visibility');
      console.log('👑 Crown visibility toggled via Tauri');
    } catch (err) {
      console.error('❌ Failed to toggle crown visibility:', err);
    }
  }

  async function copyOverlayLink() {
    const overlayUrl = 'http://localhost:5173/overlay';
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(overlayUrl);
        alert(`Overlay link copied to clipboard:\n${overlayUrl}`);
      } catch (err) {
        alert(`Please copy this overlay link:\n${overlayUrl}`);
      }
    } else {
      alert(`Please copy this overlay link:\n${overlayUrl}`);
    }
  }

  // Toggle functions
  async function toggleIcon() {
    // Toggle overlay crown state only
    overlayShowCrown.set(!$overlayShowCrown);
  }

  async function toggleGoal() {
    // Toggle overlay goal state only
    overlayShowGoal.set(!$overlayShowGoal);
  }

  async function copyLink() {
    await copyOverlayLink();
  }

  // Settings functions
  function startHotkeyRecording(action: string) {
    recordingHotkey = action;
    console.log(`🎹 Recording hotkey for ${action}...`);
    
    // Clear any existing timeout
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }
    
    // Set timeout to stop recording after 5 seconds
    recordingTimeout = setTimeout(() => {
      stopHotkeyRecording();
    }, 5000);
  }
  
  function stopHotkeyRecording() {
    recordingHotkey = null;
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }
    console.log('🎹 Stopped hotkey recording');
  }
  
  function updateHotkey(action: string, newKey: string) {
    customHotkeys[action] = newKey;
    // Here you would normally save to Tauri backend
    console.log(`🎹 Updated hotkey for ${action}: ${newKey}`);
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    // Don't handle global keys if we're in a modal
    if (showSettingsModal || showPresetModal) {
      return;
    }
    
    // Handle hotkey recording
    if (recordingHotkey) {
      event.preventDefault();
      event.stopPropagation();
      
      const keys: string[] = [];
      
      if (event.altKey) keys.push('Alt');
      if (event.ctrlKey) keys.push('Ctrl');
      if (event.shiftKey) keys.push('Shift');
      if (event.metaKey) keys.push('Meta');
      
      // Add the main key
      if (event.key !== 'Alt' && event.key !== 'Ctrl' && event.key !== 'Shift' && event.key !== 'Meta') {
        keys.push(event.key.toUpperCase());
      }
      
      if (keys.length > 0) {
        const newHotkey = keys.join('+');
        updateHotkey(recordingHotkey, newHotkey);
        stopHotkeyRecording();
      }
      return;
    }

    // Handle number editing with hotkeys (when not already editing)
    if (!editingWin && !editingGoal) {
      if (event.key === 'Enter') {
        event.preventDefault();
        // If goal is visible, start editing goal, otherwise start editing win
        if ($showGoal) {
          startEditGoal();
        } else {
          startEditWin();
        }
        return;
      }
    }

    // Don't interfere with editing mode - let the input handlers deal with it
    if (editingWin || editingGoal) {
      return;
    }
  }

  // Number editing functions
  function startEditWin() {
    if (editingGoal) return; // Prevent editing both at same time
    editingWin = true;
    winEditValue = $win.toString();
    setTimeout(() => {
      if (winInputElement) {
        winInputElement.focus();
        // Place cursor at end without selecting all text
        const length = winInputElement.value.length;
        winInputElement.setSelectionRange(length, length);
      }
    }, 10);
  }

  function startEditGoal() {
    if (editingWin) return; // Prevent editing both at same time
    editingGoal = true;
    goalEditValue = $goal.toString();
    setTimeout(() => {
      if (winInputElement) {
        winInputElement.focus();
        // Place cursor at end without selecting all text
        const length = winInputElement.value.length;
        winInputElement.setSelectionRange(length, length);
      }
    }, 10);
  }

  function saveWinEdit() {
    if (!editingWin) return;
    
    // Handle empty or invalid input
    if (winEditValue === '' || winEditValue === '-') {
      cancelWinEdit();
      return;
    }
    
    const newValue = parseInt(winEditValue);
    if (!isNaN(newValue) && newValue >= -10000 && newValue <= 10000) {
      tauriSetWin(newValue);
      editingWin = false;
      winEditValue = '';
      } else {
      // Show warning effect
      console.log('⚠️ Win value out of range (-10000 to 10000)');
      if (winInputElement) {
        winInputElement.classList.add('warning');
        setTimeout(() => {
          winInputElement?.classList.remove('warning');
        }, 500);
      }
      // Don't exit edit mode, let user fix the value
    }
  }

  function saveGoalEdit() {
    if (!editingGoal) return;
    
    // Handle empty or invalid input
    if (goalEditValue === '' || goalEditValue === '-') {
      cancelGoalEdit();
      return;
    }
    
    const newValue = parseInt(goalEditValue);
    if (!isNaN(newValue) && newValue >= -10000 && newValue <= 10000) {
      tauriSetGoal(newValue);
      editingGoal = false;
      goalEditValue = '';
    } else {
      // Show warning effect
      console.log('⚠️ Goal value out of range (-10000 to 10000)');
      if (winInputElement) {
        winInputElement.classList.add('warning');
        setTimeout(() => {
          winInputElement?.classList.remove('warning');
        }, 500);
      }
      // Don't exit edit mode, let user fix the value
    }
  }

  function cancelWinEdit() {
    editingWin = false;
    winEditValue = '';
  }

  function cancelGoalEdit() {
    editingGoal = false;
    goalEditValue = '';
  }

  function handleWinInputKeydown(event: KeyboardEvent) {
    // Prevent hotkey interference while editing
    if (editingWin) {
      // Allow these keys for editing
      if (['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveWinEdit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelWinEdit();
        }
        return;
      }
      
      // Allow control keys
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      
      // Check if it's a valid number key or minus sign
      if (/^[0-9-]$/.test(event.key)) {
        const target = event.target as HTMLInputElement;
        const currentValue = target.value;
        const cursorPos = target.selectionStart || 0;
        
        // Simulate what the value would be after this keypress
        const newValue = currentValue.slice(0, cursorPos) + event.key + currentValue.slice(target.selectionEnd || cursorPos);
        
        // Check if the new value would be valid
        if (newValue === '' || newValue === '-' || /^-?\d*$/.test(newValue)) {
          if (newValue !== '' && newValue !== '-') {
            const numValue = parseInt(newValue);
            if (!isNaN(numValue) && (numValue < -10000 || numValue > 10000)) {
              // Show warning effect
              target.classList.add('warning');
              setTimeout(() => {
                target.classList.remove('warning');
              }, 300);
              console.log('⚠️ Cannot enter value outside range -10000 to 10000');
              event.preventDefault();
              return;
            }
          }
        } else {
          event.preventDefault();
          return;
        }
        
        return;
      }
      
      // Block all other keys while editing
      event.preventDefault();
      return;
    }
  }

  function handleGoalInputKeydown(event: KeyboardEvent) {
    // Prevent hotkey interference while editing
    if (editingGoal) {
      // Allow these keys for editing
      if (['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveGoalEdit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelGoalEdit();
        }
        return;
      }
      
      // Allow control keys
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      
      // Check if it's a valid number key or minus sign
      if (/^[0-9-]$/.test(event.key)) {
        const target = event.target as HTMLInputElement;
        const currentValue = target.value;
        const cursorPos = target.selectionStart || 0;
        
        // Simulate what the value would be after this keypress
        const newValue = currentValue.slice(0, cursorPos) + event.key + currentValue.slice(target.selectionEnd || cursorPos);
        
        // Check if the new value would be valid
        if (newValue === '' || newValue === '-' || /^-?\d*$/.test(newValue)) {
          if (newValue !== '' && newValue !== '-') {
            const numValue = parseInt(newValue);
            if (!isNaN(numValue) && (numValue < -10000 || numValue > 10000)) {
              // Show warning effect
              target.classList.add('warning');
              setTimeout(() => {
                target.classList.remove('warning');
              }, 300);
              console.log('⚠️ Cannot enter value outside range -10000 to 10000');
              event.preventDefault();
              return;
            }
          }
        } else {
          event.preventDefault();
          return;
        }
        
      return;
    }
    
      // Block all other keys while editing
      event.preventDefault();
      return;
    }
  }

  function handleWinInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    // Allow only numbers, minus sign, and empty string
    if (value === '' || value === '-' || /^-?\d*$/.test(value)) {
      // Check if the value would be within range
      if (value === '' || value === '-') {
        winEditValue = value;
        } else {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= -10000 && numValue <= 10000) {
          winEditValue = value;
        } else {
          // Show warning effect
          target.classList.add('warning');
          setTimeout(() => {
            target.classList.remove('warning');
          }, 300);
          
          // Revert to previous valid value immediately
          target.value = winEditValue;
          // Also reset cursor position to end
          setTimeout(() => {
            const length = target.value.length;
            target.setSelectionRange(length, length);
          }, 0);
          console.log('⚠️ Cannot enter value outside range -10000 to 10000');
        }
      }
    } else {
      // Revert to previous valid value for invalid characters
      target.value = winEditValue;
      // Reset cursor position to end
      setTimeout(() => {
        const length = target.value.length;
        target.setSelectionRange(length, length);
      }, 0);
    }
  }

  function handleGoalInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    // Allow only numbers, minus sign, and empty string
    if (value === '' || value === '-' || /^-?\d*$/.test(value)) {
      // Check if the value would be within range
      if (value === '' || value === '-') {
        goalEditValue = value;
    } else {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= -10000 && numValue <= 10000) {
          goalEditValue = value;
        } else {
          // Show warning effect
          target.classList.add('warning');
          setTimeout(() => {
            target.classList.remove('warning');
          }, 300);
          
          // Revert to previous valid value immediately
          target.value = goalEditValue;
          // Also reset cursor position to end
          setTimeout(() => {
            const length = target.value.length;
            target.setSelectionRange(length, length);
          }, 0);
          console.log('⚠️ Cannot enter value outside range -10000 to 10000');
        }
      }
    } else {
      // Revert to previous valid value for invalid characters
      target.value = goalEditValue;
      // Reset cursor position to end
      setTimeout(() => {
        const length = target.value.length;
        target.setSelectionRange(length, length);
      }, 0);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    console.log(`🔊 Sound ${soundEnabled ? 'enabled' : 'disabled'}`);
  }

  function resetSoundDefaults() {
    soundEnabled = true;
    customIncreaseSound = null;
    customDecreaseSound = null;
    audioUpCustom = null;
    audioDownCustom = null;
    console.log('🔊 Sound settings reset to defaults');
  }

  async function handleSoundUpload(event: Event, type: 'increase' | 'decrease') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('กรุณาเลือกไฟล์เสียง (MP3 หรือ WAV) เท่านั้น');
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      if (type === 'increase') {
        customIncreaseSound = url;
        audioUpCustom = new Audio(url);
      } else {
        customDecreaseSound = url;
        audioDownCustom = new Audio(url);
      }
      console.log(`🔊 Custom ${type} sound uploaded: ${file.name}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${type} sound:`, err);
      alert('เกิดข้อผิดพลาดในการอัพโหลดไฟล์เสียง');
    }
  }

  function playCustomIncreaseSound() {
    if (soundEnabled && audioUpCustom) {
      audioUpCustom.currentTime = 0;
      audioUpCustom.play().catch(console.error);
    } else if (soundEnabled && audioUp) {
      audioUp.currentTime = 0;
      audioUp.play().catch(console.error);
    }
  }

  function playCustomDecreaseSound() {
    if (soundEnabled && audioDownCustom) {
      audioDownCustom.currentTime = 0;
      audioDownCustom.play().catch(console.error);
    } else if (soundEnabled && audioDown) {
      audioDown.currentTime = 0;
      audioDown.play().catch(console.error);
    }
  }

  // Preset management functions
  async function loadPresets() {
    try {
      // Load from presets directory
      const presetFiles = ['Default', 'REPO']; // For now, hardcoded list
      presets.set(presetFiles);
    } catch (err) {
      console.error('❌ Failed to load presets:', err);
      presets.set(['Default']);
    }
  }

  async function loadPreset(presetName: string) {
    try {
      // Here you would normally load from file, for now use hardcoded data
      let presetData;
      if (presetName === 'REPO') {
        presetData = { win: 0, goal: 50, showCrown: true, showGoal: true };
      } else {
        presetData = { win: 0, goal: 10, showCrown: true, showGoal: true };
      }
      
      // Apply preset data
      await tauriSetWin(presetData.win);
      await tauriSetGoal(presetData.goal);
      showCrown.set(presetData.showCrown);
      showGoal.set(presetData.showGoal);
      currentPreset.set(presetName);
      
      console.log(`✅ Loaded preset: ${presetName}`);
    } catch (err) {
      console.error('❌ Failed to load preset:', err);
    }
  }

  async function saveCurrentAsPreset() {
    if (!newPresetName.trim()) return;
    
    try {
      const presetData = {
        presetName: newPresetName,
        win: $win,
        goal: $goal,
        showCrown: $showCrown,
        showGoal: $showGoal
      };
      
      // Add to presets list if not already there
      const currentPresets = $presets;
      if (!currentPresets.includes(newPresetName)) {
        presets.set([...currentPresets, newPresetName]);
      }
      
      console.log(`✅ Saved preset: ${newPresetName}`);
      newPresetName = '';
      showPresetModal = false;
      } catch (err) {
      console.error('❌ Failed to save preset:', err);
    }
  }

  async function deletePreset(presetName: string) {
    if (presetName === 'Default') {
      alert('ไม่สามารถลบ Preset เริ่มต้นได้');
      return;
    }
    
    if (confirm(`คุณต้องการลบ Preset "${presetName}" หรือไม่?`)) {
      try {
        const currentPresets = $presets.filter(p => p !== presetName);
        presets.set(currentPresets);
        
        if ($currentPreset === presetName) {
          await loadPreset('Default');
        }
        
        console.log(`✅ Deleted preset: ${presetName}`);
    } catch (err) {
        console.error('❌ Failed to delete preset:', err);
      }
    }
  }

  async function hide_to_tray() {
    if (!browser) {
      console.log('❌ Cannot hide to tray: browser not available');
      return;
    }
    try {
      await invoke('hide_to_tray');
      console.log('🫥 App hidden to tray');
    } catch (err) {
      console.error('❌ Failed to hide to tray:', err);
    }
  }

  // Window control functions
  async function minimize_app() {
    if (!browser) {
      console.log('❌ Cannot minimize: browser not available');
      return;
    }
    try {
      await invoke('minimize_app');
      console.log('🔽 Window minimized');
    } catch (err) {
      console.error('❌ Failed to minimize window:', err);
    }
  }

  // Initialize everything on mount
  onMount(async () => {
    console.log('✅ App initializing...');
    
    // Initialize audio elements with correct paths for dev mode
    try {
      audioUp = new Audio('/assets/sfx/increase.mp3');
      audioDown = new Audio('/assets/sfx/decrease.mp3');
      
      // Add event listeners to check if audio loads successfully
      audioUp.addEventListener('canplaythrough', () => {
        console.log('🔊 Increase audio loaded successfully');
      });
      audioUp.addEventListener('error', (e) => {
        console.error('❌ Failed to load increase audio:', e);
      });
      
      audioDown.addEventListener('canplaythrough', () => {
        console.log('🔊 Decrease audio loaded successfully');
      });
      audioDown.addEventListener('error', (e) => {
        console.error('❌ Failed to load decrease audio:', e);
      });
      
      console.log('🔊 Audio elements initialized');
      } catch (err) {
      console.error('❌ Failed to initialize audio:', err);
    }
    
    // Initialize Tauri connection
    await initializeTauri();
    
    // Load presets
    await loadPresets();
    
    // Add global key event listener for hotkey recording
    if (browser) {
      document.addEventListener('keydown', handleKeyPress, true);
    }
    
    initOverlayWebSocket();
    
    console.log('✅ App initialization complete');
  });

  onDestroy(() => {
    if (unlisten) {
      unlisten();
    }
    if (overlayWebSocket) {
      overlayWebSocket.close();
    }
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }
    if (browser) {
      document.removeEventListener('keydown', handleKeyPress, true);
    }
  });

  // ... existing code ...
  $: winLength = Math.abs($win).toString().length; // ใช้ Math.abs เพื่อไม่นับเครื่องหมาย -
  $: winSizeClass =
    winLength <= 2 ? 'win-size-2' :
    winLength === 3 ? 'win-size-3' :
    winLength === 4 ? 'win-size-4' :
    winLength === 5 ? 'win-size-5' :
    'win-size-6';
  
  // Real-time size calculation for input field
  $: inputLength = winEditValue ? Math.abs(parseInt(winEditValue) || 0).toString().length : winLength;
  $: inputSizeClass =
    inputLength <= 2 ? 'win-size-2' :
    inputLength === 3 ? 'win-size-3' :
    inputLength === 4 ? 'win-size-4' :
    inputLength === 5 ? 'win-size-5' :
    'win-size-6';
  
  // Debug logging
  $: console.log(`Win: ${$win}, Abs: ${Math.abs($win)}, Length: ${winLength}, Class: ${winSizeClass}`);
  $: console.log(`Input: ${winEditValue}, InputLength: ${inputLength}, InputClass: ${inputSizeClass}`);
  // ... existing code ...





  // Send updates to overlay when overlay state changes
  $: if (overlayWebSocket && overlayWebSocket.readyState === WebSocket.OPEN) {
            sendToOverlay({
          win: $win,
          goal: $goal,
          show_crown: $overlayShowCrown,
          show_goal: $overlayShowGoal,
          current_preset: $currentPreset
        });
  }
</script>

<!-- Audio elements for sound effects -->
<audio bind:this={audioUp} preload="auto">
  <source src="/assets/sfx/increase.mp3" type="audio/mpeg" />
</audio>
<audio bind:this={audioDown} preload="auto">
  <source src="/assets/sfx/decrease.mp3" type="audio/mpeg" />
</audio>

<div class="control-app">
  <!-- Window Controls -->
  <div class="window-controls-left">
    <button on:click={minimize_app} class="window-btn minimize-btn" title="Minimize">−</button>
  </div>
  <div class="window-controls-right">
    <button on:click={hide_to_tray} class="window-btn close-btn" title="Hide to Tray">×</button>
  </div>

  <!-- Main Content -->
  <div class="main-content">
    <!-- App Title -->
    <h1 class="app-title">PRESET</h1>
    
    <!-- Win Counter Section -->
    <div class="counter-section">
      <div class="counter-display">
        <div class="counter-content">
          {#if $appShowCrown}
            <div class="crown-container">
              <img src="/assets/ui/app_crown.png" alt="Crown" class="crown-icon" />
            </div>
          {/if}
          <div class="win-number-container">
            {#if editingWin}
              <input 
                bind:this={winInputElement}
                bind:value={winEditValue}
                on:keydown={handleWinInputKeydown}
                on:input={handleWinInputChange}
                on:blur={saveWinEdit}
                class="win-number-input {inputSizeClass}"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="off"
                spellcheck="false"
                aria-label="Edit win count"
                placeholder=""
              />
            {:else}
              <div 
                class="win-number {winSizeClass}"
                on:click={startEditWin} 
                on:keydown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    startEditWin();
                  }
                }}
                role="button" 
                tabindex="0"
                aria-label="Win count: {$win}. Click to edit or press Enter"
              >
                {$win}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Section -->
    <div class="goal-container">
      <span class="goal-label">GOAL:</span>
      <div class="goal-number-box">
        {#if editingGoal}
          <input
            bind:this={goalInputElement}
            bind:value={goalEditValue}
            on:keydown={handleGoalInputKeydown}
            on:input={handleGoalInputChange}
            on:blur={saveGoalEdit}
            class="goal-value-input"
            type="text"
            inputmode="numeric"
            maxlength="6"
            autocomplete="off"
            spellcheck="false"
            aria-label="Edit goal count"
            placeholder=""
          />
        {:else}
          <span 
            class="goal-value" 
            on:click={startEditGoal} 
            on:keydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                startEditGoal();
              }
            }}
            role="button" 
            tabindex="0"
            aria-label="Goal count: {$goal}. Click to edit or press Enter"
          >
            {$goal}
          </span>
        {/if}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-section">
      <!-- Preset Button -->
      <button class="preset-btn" on:click={() => showPresetModal = true}>
        PRESET
      </button>

      <!-- Donate Button -->
      <button class="donate-btn" on:click={() => console.log('Donate clicked - logic to be added later')}>
        DONATE
      </button>

      <!-- Toggle Controls -->
      <div class="toggle-container">
        <div class="toggle-controls">
          <!-- Icon Toggle -->
          <div class="toggle-row">
            <span class="toggle-label">ICON</span>
            <button 
              class="toggle-switch {$overlayShowCrown ? 'active' : ''}"
              on:click={toggleIcon}
              role="switch"
              aria-checked={$overlayShowCrown}
              tabindex="0"
            >
              <div class="toggle-knob"></div>
            </button>
          </div>

          <!-- Divider -->
          <div class="toggle-divider"></div>

          <!-- Goal Toggle -->
          <div class="toggle-row goal-toggle-row">
            <span class="toggle-label">GOAL</span>
            <button 
              class="toggle-switch {$overlayShowGoal ? 'active' : ''}"
              on:click={toggleGoal}
              role="switch"
              aria-checked={$overlayShowGoal}
              tabindex="0"
            >
              <div class="toggle-knob"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Action Buttons -->
  <div class="bottom-actions" style="margin-top: -69px;">
    <button class="action-btn secondary settings-btn" on:click={() => showSettingsModal = true}>
      Setting
    </button>
    <button class="action-btn secondary copy-btn" on:click={copyLink}>
      Copy Link
    </button>
  </div>

  <!-- Settings Modal -->
  {#if showSettingsModal}
    <div class="modal-backdrop" on:click={() => showSettingsModal = false} on:keydown={(e) => e.key === 'Escape' && (showSettingsModal = false)} role="button" tabindex="0">
      <div class="modal settings-modal" on:click|stopPropagation role="dialog" aria-labelledby="settings-title">
        <div class="modal-header">
          <h3 id="settings-title">⚙️ ตั้งค่า</h3>
          <button class="modal-close" on:click={() => showSettingsModal = false}>×</button>
        </div>
        
        <!-- Settings Tabs -->
        <div class="settings-tabs">
          <button 
            class="settings-tab {settingsTab === 'hotkey' ? 'active' : ''}"
            on:click={() => settingsTab = 'hotkey'}
          >
            ⌨️ ปุ่มลัด
          </button>
          <button 
            class="settings-tab {settingsTab === 'sound' ? 'active' : ''}"
            on:click={() => settingsTab = 'sound'}
          >
            🔊 เสียง
          </button>
        </div>

        <div class="modal-body">
          {#if settingsTab === 'hotkey'}
            <!-- Hotkey Customization -->
          <div class="settings-group">
              <h4 class="settings-group-title">🎹 ปรับแต่งปุ่มลัด</h4>
              <p class="settings-note">
                คลิกที่ปุ่มลัดเพื่อเปลี่ยน (รองรับปุ่มใดๆ และการรวม 3 ปุ่ม)
              </p>
              
              <div class="hotkey-customization">
                <div class="hotkey-item">
                  <span class="hotkey-label">เพิ่ม (+1):</span>
                  <button 
                    class="hotkey-input {recordingHotkey === 'increment' ? 'recording' : ''}"
                    on:click={() => startHotkeyRecording('increment')}
                  >
                    {recordingHotkey === 'increment' ? 'กดปุ่ม...' : customHotkeys.increment}
                  </button>
              </div>
                
                <div class="hotkey-item">
                  <span class="hotkey-label">ลด (-1):</span>
                  <button 
                    class="hotkey-input {recordingHotkey === 'decrement' ? 'recording' : ''}"
                    on:click={() => startHotkeyRecording('decrement')}
                  >
                    {recordingHotkey === 'decrement' ? 'กดปุ่ม...' : customHotkeys.decrement}
                  </button>
              </div>
                
                <div class="hotkey-item">
                  <span class="hotkey-label">เพิ่ม (+10):</span>
                  <button 
                    class="hotkey-input {recordingHotkey === 'increment10' ? 'recording' : ''}"
                    on:click={() => startHotkeyRecording('increment10')}
                  >
                    {recordingHotkey === 'increment10' ? 'กดปุ่ม...' : customHotkeys.increment10}
                  </button>
              </div>
                
                <div class="hotkey-item">
                  <span class="hotkey-label">ลด (-10):</span>
                  <button 
                    class="hotkey-input {recordingHotkey === 'decrement10' ? 'recording' : ''}"
                    on:click={() => startHotkeyRecording('decrement10')}
                  >
                    {recordingHotkey === 'decrement10' ? 'กดปุ่ม...' : customHotkeys.decrement10}
                  </button>
              </div>
          </div>

              <div class="settings-actions">
                <button class="settings-btn reset" on:click={() => {
                  customHotkeys = {
                    increment: 'Alt+=',
                    decrement: 'Alt+-',
                    increment10: 'Alt+Shift+=',
                    decrement10: 'Alt+Shift+-'
                  };
                }}>
                  🔄 รีเซ็ตเป็นค่าเริ่มต้น
                </button>
              </div>
            </div>
          {:else if settingsTab === 'sound'}
            <!-- Sound Customization -->
          <div class="settings-group">
              <h4 class="settings-group-title">🔊 ปรับแต่งเสียง</h4>
              
              <!-- Sound Toggle -->
              <div class="sound-toggle">
                <span class="sound-toggle-label">เปิด/ปิดเสียง:</span>
                <button 
                  class="toggle-switch {soundEnabled ? 'active' : ''}"
                  on:click={toggleSound}
                  role="switch"
                  aria-checked={soundEnabled}
                >
                  <div class="toggle-knob"></div>
                </button>
              </div>
              
              <!-- Custom Sound Upload -->
              <div class="sound-upload-section">
                <h5 class="sound-section-title">📁 อัพโหลดเสียงใหม่</h5>
                
                <div class="sound-upload-item">
                  <span class="sound-upload-label">เสียงเพิ่ม:</span>
                  <input 
                    type="file" 
                    accept="audio/mp3,audio/wav"
                    on:change={(e) => handleSoundUpload(e, 'increase')}
                    class="sound-file-input"
                    id="increase-sound-input"
                  />
                  <label for="increase-sound-input" class="sound-upload-btn">
                    📂 เลือกไฟล์
                  </label>
                  {#if customIncreaseSound}
                    <button class="sound-test-btn" on:click={playCustomIncreaseSound}>
                      🔊 ทดสอบ
                    </button>
                  {/if}
                </div>
                
                <div class="sound-upload-item">
                  <span class="sound-upload-label">เสียงลด:</span>
                  <input 
                    type="file" 
                    accept="audio/mp3,audio/wav"
                    on:change={(e) => handleSoundUpload(e, 'decrease')}
                    class="sound-file-input"
                    id="decrease-sound-input"
                  />
                  <label for="decrease-sound-input" class="sound-upload-btn">
                    📂 เลือกไฟล์
                  </label>
                  {#if customDecreaseSound}
                    <button class="sound-test-btn" on:click={playCustomDecreaseSound}>
                      🔊 ทดสอบ
                    </button>
                  {/if}
                </div>
              </div>
              
              <!-- Test Default Sounds -->
              <div class="sound-test-section">
                <h5 class="sound-section-title">🔊 ทดสอบเสียงเริ่มต้น</h5>
                <div class="sound-test-controls">
              <button on:click={playIncreaseSound} class="sound-btn test">
                🔊 ทดสอบเสียงเพิ่ม
              </button>
              <button on:click={playDecreaseSound} class="sound-btn test">
                🔊 ทดสอบเสียงลด
              </button>
            </div>
          </div>
              
              <!-- Reset Sound Settings -->
              <div class="settings-actions">
                <button class="settings-btn reset" on:click={resetSoundDefaults}>
                  🔄 รีเซ็ตเป็นค่าเริ่มต้น
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Preset Modal -->
  {#if showPresetModal}
    <div class="modal-backdrop" on:click={() => showPresetModal = false} on:keydown={(e) => e.key === 'Escape' && (showPresetModal = false)} role="button" tabindex="0">
      <div class="modal preset-modal" on:click|stopPropagation role="dialog" aria-labelledby="preset-title">
        <div class="modal-header">
          <h3 id="preset-title">📁 จัดการ PRESET</h3>
          <button class="modal-close" on:click={() => showPresetModal = false}>×</button>
        </div>
        <div class="modal-body">
          <!-- Current Preset -->
          <div class="settings-group">
            <h4 class="settings-group-title">Preset ปัจจุบัน: {$currentPreset}</h4>
          </div>

          <!-- Preset List -->
          <div class="settings-group">
            <h4 class="settings-group-title">📋 รายการ Preset</h4>
            <div class="preset-list">
              {#each $presets as preset}
                <div class="preset-item">
                  <div class="preset-info">
                    <span class="preset-name">{preset}</span>
                    {#if preset === $currentPreset}
                      <span class="preset-current">กำลังใช้</span>
                    {/if}
                  </div>
                  <div class="preset-actions">
                    <button 
                      on:click={() => loadPreset(preset)} 
                      class="preset-btn load"
                      disabled={preset === $currentPreset}
                    >
                      📂 โหลด
                    </button>
                    <button 
                      on:click={() => editingPreset = preset} 
                      class="preset-btn edit"
                    >
                      ✏️ แก้ไข
                    </button>
                    <button 
                      on:click={() => deletePreset(preset)} 
                      class="preset-btn delete"
                      disabled={preset === 'Default'}
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Create New Preset -->
          <div class="settings-group">
            <h4 class="settings-group-title">➕ สร้าง Preset ใหม่</h4>
            <div class="create-preset">
              <input 
                type="text" 
                bind:value={newPresetName} 
                placeholder="ชื่อ Preset ใหม่" 
                class="preset-name-input"
              />
              <button 
                on:click={saveCurrentAsPreset} 
                class="preset-btn create"
                disabled={!newPresetName.trim()}
              >
                💾 บันทึก
              </button>
            </div>
            <p class="settings-note">
              จะบันทึกค่าปัจจุบัน: Win = {$win}, Goal = {$goal}, มงกุฎ = {$showCrown ? 'เปิด' : 'ปิด'}, เป้าหมาย = {$showGoal ? 'เปิด' : 'ปิด'}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
          </div>

<style>
  .control-app {
    width: 496px;
    height: 796px;
    background: transparent;
    color: #ffffff;
    font-family: 'MiSansThai-Normal', sans-serif;
    overflow: visible;
    position: relative;
    -webkit-app-region: drag;
    border-radius: 32px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 0;
    box-sizing: border-box;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    z-index: 0;
    margin: 0 auto;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'MiSansThai-Normal', sans-serif;
    color: #fff;
    overflow-x: hidden;
  }
  .main-content {
    width: 476px;
    height: 776px;
    background: #040319;
    border-radius: 28px;
    margin: 10px auto;
    position: relative;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    padding-top: calc(20px + 32px - 12px); /* เลื่อนขึ้น 12px */
    z-index: 1;
    justify-content: flex-start; /* เปลี่ยนจาก space-evenly เป็น flex-start */
    overflow: hidden;
    box-sizing: border-box;
    transform: translateX(-3px);
  }
  .app-title {
    font-size: calc(476px * 0.14); /* 14% of main-content width = ~67px */
    font-family: 'MiSansThai', sans-serif;
    font-weight: 400;
    color: #00e5ff;
    text-align: center;
    margin: 0;
    letter-spacing: 0.02em;
    flex-shrink: 0;
    width: 100%;
    line-height: 1.1;
  }
  .counter-section {
    margin: calc(476px * 0.01) 0 0 0; /* ลด margin-top */
    padding: 0; 
    width: calc(476px * 0.80); /* 80% กลับมาให้กล่องตัวเลขไม่โดนบีบ */
    max-width: 380px;
    display: flex; justify-content: center; flex-shrink: 0;
  }
  .counter-display {
    background: transparent;
    border-radius: calc(476px * 0.042); /* ~20px */
    backdrop-filter: none;
    border: 2px solid #00e5ff; /* ลดจาก 3px เป็น 2px */
    width: 100%;
    height: calc(776px * 0.20 - 15px); /* ลดอีก 6px รวม 15px */
    padding: calc(476px * 0.042); /* ~20px */
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    box-sizing: border-box;
  }
  .counter-content {
    display: flex; align-items: center; gap: calc(476px * 0.025); /* ~12px ลดระยะห่าง */
    width: 100%; justify-content: center;
  }
  .crown-container {
    display: flex; align-items: center; justify-content: center;
    width: calc(476px * 0.40); /* 40% = ~190px ลดขนาด container */
    height: calc(776px * 0.155); /* ~120px เพิ่มความสูง */
  }
  .crown-icon {
    width: calc(476px * 0.35 + 12px); /* เพิ่มอีก 6px รวม 12px */
    height: calc(476px * 0.35 + 12px);
    transform: translateX(-10px); /* เลื่อนไปทางซ้าย 10px (-18px + 8px) */
  }
  .win-number-container {
    display: flex; align-items: center; justify-content: center;
    width: calc(476px * 0.35); /* 35% = ~167px */
    height: calc(776px * 0.16 - 12px); /* ลดลง 12px */
    background: transparent; 
    border-radius: calc(476px * 0.042); /* ~20px */
    border: 3px solid #00e5ff;
    overflow: hidden;
    padding: 0 6px;
    flex-shrink: 0;
  }
  .win-number {
    font-size: 100px;
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700; 
    color: #00e5ff; 
    text-align: center;
    width: 100%;
    line-height: 1.1;
    transition: font-size 0.2s;
    letter-spacing: 0.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .win-size-2 { font-size: 100px; }
  .win-size-3 { font-size: 68px; }
  .win-size-4 { font-size: 55px; }
  .win-size-5 { font-size: 45px; }
  .win-size-6 { font-size: 38px; }
  @media (max-width: 500px) {
    .win-size-2 { font-size: 100px; }
    .win-size-3 { font-size: 68px; }
    .win-size-4 { font-size: 55px; }
    .win-size-5 { font-size: 45px; }
    .win-size-6 { font-size: 38px; }
  }
  .goal-container {
    display: flex; 
    align-items: center; 
    gap: calc(476px * 0.01 + 6px); /* เพิ่มระยะห่าง 6px */
    margin-top: calc(476px * 0.035 - 6px); /* ลดระยะห่าง 6px */
    margin-bottom: calc(476px * 0.025 - 6px); /* ลดระยะห่าง 6px */
    width: calc(476px * 0.92); /* 92% เท่ากับปุ่ม PRESET */
    max-width: 438px; /* เท่ากับปุ่ม PRESET */
    justify-content: space-between; /* แยกซ้ายขวา */
    flex-shrink: 0;
  }
  .goal-label {
    font-size: calc(476px * 0.055); /* ~26px ลดขนาดนิดหน่อย */
    font-family: 'MiSansThai-Bold', sans-serif;
    color: #00e5ff; 
    font-weight: 700; /* Bold */
    margin-bottom: 0;
    flex-shrink: 0; /* ไม่ให้หด */
  }
  .goal-number-box {
    background: transparent; 
    border-radius: calc(476px * 0.015); /* ~7px ความโค้งเล็กน้อย */
    padding: calc(476px * 0.01) calc(476px * 0.042); /* ~5px ~20px ลดความสูง */
    font-size: calc(476px * 0.063); /* ~30px */
    font-family: 'MiSansThai-Semibold', sans-serif;
    color: #00e5ff; 
    font-weight: 600;
    flex: 1; /* ขยายเต็มพื้ที่ที่เหลือ */
    text-align: center;
    border: 2px solid #00e5ff;
    margin-right: 12px; /* เพิ่มอีก 6px รวม 12px */
  }
  .action-section {
    width: 100%; 
    margin: calc(476px * 0.015) 0 0 0; /* ลด margin-top */
    gap: 0; /* ลบระยะห่างให้ชิดกัน */
    display: flex; flex-direction: column; align-items: center; flex-shrink: 0;
  }
  .preset-btn {
    background: transparent;
    border: 4px solid #00e5ff;
    outline: none;
    border-radius: calc(476px * 0.042); /* ~20px */
    color: #00e5ff;
    font-size: calc(476px * 0.084); /* ~40px */
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700; /* Bold */
    padding: calc(776px * 0.019) calc(476px * 0.126); /* ~15px ~60px */
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag;
    width: calc(476px * 0.92); /* 92% */
    max-width: 438px;
    margin-bottom: calc(776px * 0.013); /* ~10px */
  }

  .preset-btn:hover {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    transform: translateY(-3px);
  }

  .donate-btn {
    background: transparent;
    border: 4px solid #00e5ff;
    outline: none;
    border-radius: calc(476px * 0.042); /* ~20px */
    color: #00e5ff;
    font-size: calc(476px * 0.084); /* ~40px */
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700; /* Bold */
    padding: calc(776px * 0.019) calc(476px * 0.126); /* ~15px ~60px */
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag;
    width: calc(476px * 0.92); /* 92% */
    max-width: 438px;
    margin-bottom: calc(776px * 0.013); /* ~10px */
  }

  .donate-btn:hover {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    transform: translateY(-3px);
  }
  .toggle-container {
    width: calc(476px * 0.92 - 12px); /* ลดความยาว 12px */
    max-width: 426px; /* ลดตาม */
    background: transparent; 
    border: 2px solid #00e5ff; 
    border-radius: calc(476px * 0.042); /* ~20px */
    padding: calc(776px * 0.042) calc(476px * 0.042) calc(776px * 0.019) calc(476px * 0.042); /* ลดความสูงด้านล่างให้ชิดกับ GOAL */
    margin: calc(776px * 0.01) auto 0 auto; /* ลด margin-top */
    box-sizing: border-box;
    display: flex; flex-direction: column; align-items: center; position: relative;
    height: auto; 
    flex-shrink: 0;
  }
  .toggle-controls {
    display: flex; flex-direction: column; gap: calc(776px * 0.006); /* ~5px */
    width: 100%; max-width: calc(476px * 0.84); /* ~400px */
    align-items: flex-start; justify-content: center; margin: 0;
  }
  .toggle-row {
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; min-height: calc(776px * 0.045); /* ~35px */
    padding: 0; /* ลบ padding เพื่อให้ชิดกับกล่อง */
    margin-top: -17px; /* เลื่อนขึ้นอีก 9px */
    padding-right: 6px; /* ลดลงเพื่อให้กล่องติดกับสวิต */
  }
  .toggle-label {
    font-size: calc(476px * 0.042 + 12px); /* ~32px เพิ่ม 12px */
    font-weight: 700; color: #00e5ff;
  }
  .toggle-switch {
    width: calc(476px * 0.15); /* เพิ่มความยาวจาก 0.126 เป็น 0.15 */
    height: calc(776px * 0.052); /* เพิ่มความสูงจาก 0.045 เป็น 0.052 */
    border-radius: calc(776px * 0.026); /* ปรับตามความสูงใหม่ */
    margin-left: 0; /* รีเซ็ต margin */
    background: #374151; border: none; position: relative; transition: background 0.3s;
    display: flex; align-items: center; cursor: pointer;
  }
  .toggle-switch.active {
    background: #00e5ff;
  }
  .toggle-knob {
    width: calc(776px * 0.038); /* เพิ่มขนาดจาก 0.032 เป็น 0.038 */
    height: calc(776px * 0.038); /* เพิ่มขนาดจาก 0.032 เป็น 0.038 */
    border-radius: 50%; background: #fff; position: absolute; 
    left: calc(776px * 0.007); /* ลดระยะห่างจากขอบ */
    top: calc(776px * 0.007); /* ลดระยะห่างจากขอบ */
    transition: left 0.3s, background 0.3s;
  }
  .toggle-switch.active .toggle-knob {
    left: calc(476px * 0.075); /* เลื่อนไปขวามากขึ้น */
    background: #fff;
  }
  .toggle-divider {
    height: 3px; background: rgba(0, 229, 255, 0.2); /* ลดความหนาจาก 4px เป็น 3px */
    margin: calc(776px * 0.013 + 3px) 0 calc(776px * 0.013) calc(476px * 0.05 - 6px); /* เลื่อนลง 3px */
    width: 90%; border-radius: 2px;
  }
  .goal-toggle-row { margin-top: 1px; } /* เลื่อนขึ้น 3px จาก 4px เป็น 1px */
  .bottom-actions {
    display: flex; justify-content: center; 
    gap: calc(476px * 0.042); /* ~20px */
    margin: -10px auto 0 auto; /* เลื่อนขึ้นมากๆให้ชิดกับ Toggle Section */
    width: calc(476px * 0.92); /* 92% เท่ากับปุ่ม PRESET */
    max-width: 438px;
    background: transparent !important; position: static; z-index: 10;
    flex-shrink: 0;
  }
  .action-btn {
    background: transparent; 
    border: 2px solid #00e5ff; 
    border-radius: calc(476px * 0.029); /* ~14px */
    color: #00e5ff;
    font-size: calc(476px * 0.029 + 9px); /* ลดจาก +12px เป็น +9px */
    font-weight: 700; 
    padding: calc(776px * 0.016) calc(476px * 0.021); /* ~12px ~10px */
    width: calc(476px * 0.40); /* 40% ของ main-content */
    max-width: 190px;
    transition: all 0.3s;
    display: flex; align-items: center; justify-content: center;
    height: calc(776px * 0.058); /* ~45px */
  }
  .action-btn:hover { 
    background: rgba(0, 229, 255, 0.15); 
    transform: translateY(-2px);
  }

  /* Modal Styles - already glassmorphism, keep as is */

  /* iOS style window controls */
  .window-controls-left, .window-controls-right {
    position: absolute; top: 20px; z-index: 30;
  }
  .window-controls-left { left: 19px; } /* เลื่อนซ้ายอีก 3px จาก 22px เป็น 19px */
  .window-controls-right { right: 28px; }
  .window-btn {
    width: 32px; height: 32px; border-radius: 6px; 
    border: 2px solid #1976d2; background: transparent;
    color: #1976d2; font-size: 1.2rem; font-weight: 600; 
    font-family: 'MiSansThai', sans-serif;
    display: flex; align-items: center; justify-content: center; 
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .window-btn:hover { 
    background: #1976d2; color: #fff; 
    transform: translateY(-1px);
  }

  /* Settings Modal Styles */
  .settings-modal {
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .settings-tabs {
    display: flex;
    border-bottom: 2px solid rgba(0, 229, 255, 0.3);
    margin-bottom: 20px;
  }

  .settings-tab {
    flex: 1;
    background: transparent;
    border: none;
    color: #00e5ff;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;
  }

  .settings-tab:hover {
    background: rgba(0, 229, 255, 0.1);
  }

  .settings-tab.active {
    border-bottom-color: #00e5ff;
    background: rgba(0, 229, 255, 0.1);
  }

  .settings-group {
    margin-bottom: 24px;
  }

  .settings-group-title {
    font-size: 18px;
    font-weight: 700;
    color: #00e5ff;
    margin-bottom: 12px;
  }

  .settings-note {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 16px;
    line-height: 1.4;
  }

  /* Hotkey Customization */
  .hotkey-customization {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .hotkey-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .hotkey-label {
    font-size: 16px;
    color: #ffffff;
    font-weight: 500;
    min-width: 120px;
  }

  .hotkey-input {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 8px;
    color: #00e5ff;
    font-size: 14px;
    font-weight: 600;
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
    text-align: center;
  }

  .hotkey-input:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .hotkey-input.recording {
    background: rgba(255, 107, 107, 0.2);
    border-color: #ff6b6b;
    color: #ff6b6b;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  /* Sound Customization */
  .sound-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 12px 0;
  }

  .sound-toggle-label {
    font-size: 16px;
    color: #ffffff;
    font-weight: 500;
  }

  .sound-upload-section {
    margin-bottom: 24px;
  }

  .sound-section-title {
    font-size: 16px;
    font-weight: 600;
    color: #00e5ff;
    margin-bottom: 12px;
  }

  .sound-upload-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .sound-upload-label {
    font-size: 14px;
    color: #ffffff;
    font-weight: 500;
    min-width: 80px;
  }

  .sound-file-input {
    display: none;
  }

  .sound-upload-btn {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 6px;
    color: #00e5ff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sound-upload-btn:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .sound-test-btn {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 6px;
    color: #00e5ff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sound-test-btn:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .sound-test-section {
    margin-bottom: 20px;
  }

  .sound-test-controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .sound-btn.test {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 6px;
    color: #00e5ff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sound-btn.test:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .settings-actions {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .settings-btn.reset {
    background: transparent;
    border: 2px solid #ff6b6b;
    border-radius: 8px;
    color: #ff6b6b;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .settings-btn.reset:hover {
    background: rgba(255, 107, 107, 0.1);
    transform: translateY(-1px);
  }

  /* Modal Styles */
  .modal-backdrop {
    position: absolute;
    top: 10px;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: 476px;
    height: 776px;
    background: rgba(0, 0, 0, 0.03);
    backdrop-filter: blur(4px); /* ลด blur เหลือ 4px */
    border-radius: 28px; /* ปรับให้ตรงกับ main-content */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    -webkit-app-region: no-drag;
    overflow: hidden;
    padding: 0;
    transform: translateX(-3px); /* เพิ่ม transform เหมือน main-content */
  }
  .modal-backdrop::before {
    content: none;
  }

  .modal {
    background: rgba(4, 3, 25, 0.95);
    border: 2px solid #00e5ff;
    border-radius: 16px;
    padding: 0;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 229, 255, 0.3);
    backdrop-filter: blur(16px);
    -webkit-app-region: no-drag;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 0 24px;
    border-bottom: 1px solid rgba(0, 229, 255, 0.2);
  }

  .modal-header h3 {
    font-size: 20px;
    font-weight: 700;
    color: #00e5ff;
    margin: 0;
  }

  .modal-close {
    background: transparent;
    border: none;
    color: #00e5ff;
    font-size: 24px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag;
  }

  .modal-close:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: scale(1.1);
  }

  .modal-body {
    padding: 20px 24px 24px 24px;
    overflow-y: auto;
    max-height: 60vh;
  }

  /* Preset Modal Specific */
  .preset-modal {
    max-width: 600px;
  }

  .preset-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .preset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(0, 229, 255, 0.05);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 8px;
  }

  .preset-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .preset-name {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .preset-current {
    font-size: 12px;
    color: #00e5ff;
    background: rgba(0, 229, 255, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .preset-actions {
    display: flex;
    gap: 8px;
  }

  .preset-btn.load,
  .preset-btn.edit,
  .preset-btn.delete,
  .preset-btn.create {
    background: transparent;
    border: 1px solid #00e5ff;
    border-radius: 4px;
    color: #00e5ff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .preset-btn.load:hover,
  .preset-btn.edit:hover,
  .preset-btn.create:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .preset-btn.delete {
    border-color: #ff6b6b;
    color: #ff6b6b;
  }

  .preset-btn.delete:hover {
    background: rgba(255, 107, 107, 0.1);
    transform: translateY(-1px);
  }

  .preset-btn.load:disabled,
  .preset-btn.edit:disabled,
  .preset-btn.delete:disabled,
  .preset-btn.create:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .create-preset {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  .preset-name-input {
    flex: 1;
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 6px;
    color: #ffffff;
    font-size: 14px;
    padding: 8px 12px;
    outline: none;
  }

  .preset-name-input:focus {
    border-color: #00e5ff;
    box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.2);
  }

  .preset-name-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  /* Editable Number Input Styles */
  .win-number-input,
  .goal-value-input {
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    text-align: center;
    width: 100%;
    padding: 0;
    margin: 0;
    caret-color: #00e5ff;
    border-radius: 4px;
    transition: all 0.2s ease;
    /* Remove default input styling */
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    /* Prevent text selection */
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .win-number-input {
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700;
    color: #00e5ff;
    text-align: center;
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    line-height: 1.1;
    letter-spacing: 0.5px;
    overflow: visible;
    padding: 0;
  }
  .win-size-2.win-number-input { font-size: 100px; }
  .win-size-3.win-number-input { font-size: 68px; }
  .win-size-4.win-number-input { font-size: 55px; }
  .win-size-5.win-number-input { font-size: 45px; }
  .win-size-6.win-number-input { font-size: 38px; }
  .win-number-input::selection {
    background: #00e5ff33;
  }

  .goal-value-input {
    font-size: calc(476px * 0.063);
    font-weight: 600;
    color: #00e5ff;
    font-family: 'MiSansThai-Semibold', sans-serif;
  }

  /* Blinking cursor effect */
  .win-number-input:focus,
  .goal-value-input:focus {
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 50% { 
      border-right: 2px solid #00e5ff;
      margin-right: -2px;
    }
    51%, 100% { 
      border-right: 2px solid transparent;
      margin-right: 0;
    }
  }

  .win-number,
  .goal-value {
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    position: relative;
  }

  .win-number:hover,
  .goal-value:hover {
    color: #00e5ff;
    text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
    transform: scale(1.02);
  }

  .win-number:focus,
  .goal-value:focus {
    outline: none;
    color: #00e5ff;
    text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
  }

  /* Enhanced warning effect for out of range values */
  .win-number-input.warning,
  .goal-value-input.warning {
    animation: shake 0.5s ease-in-out;
    border: 2px solid #ff6b6b !important;
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
    color: #ff6b6b;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }

  /* Focus indicator for better accessibility */
  .win-number:focus-visible,
  .goal-value:focus-visible {
    outline: 2px solid #00e5ff;
    outline-offset: 2px;
    border-radius: 4px;
  }

  .win-number.win-size-2, .win-number-input.win-size-2 { font-size: 100px; }
  .win-number.win-size-3, .win-number-input.win-size-3 { font-size: 68px; }
  .win-number.win-size-4, .win-number-input.win-size-4 { font-size: 55px; }
  .win-number.win-size-5, .win-number-input.win-size-5 { font-size: 45px; }
  .win-number.win-size-6, .win-number-input.win-size-6 { font-size: 38px; }
</style>