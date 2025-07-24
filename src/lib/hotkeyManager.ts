import { writable } from 'svelte/store';
import { audioManager } from './audioManager';
import { invoke } from '@tauri-apps/api/core';
import { get } from 'svelte/store';
import { hotkeySettings, type Keybind, keybindToString, keybindEquals } from './stores';

// --- Normalize shortcut to canonical format (layout-agnostic) ---
export function normalizeShortcut(shortcut: string): string {
  if (!shortcut || typeof shortcut !== 'string') return '';
  let parts = shortcut.split('+').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  const modMap: Record<string, string> = {
    'control': 'Ctrl', 'ctrl': 'Ctrl',
    'alt': 'Alt',
    'shift': 'Shift',
    'meta': 'Meta', 'cmd': 'Meta', 'command': 'Meta', 'win': 'Meta',
  };
  const modifiers: string[] = [];
  let mainKey = '';
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (modMap[lower]) {
      if (!modifiers.includes(modMap[lower])) modifiers.push(modMap[lower]);
    } else {
      mainKey = part;
    }
  }
  const modOrder = ['Ctrl', 'Alt', 'Shift', 'Meta'];
  modifiers.sort((a, b) => modOrder.indexOf(a) - modOrder.indexOf(b));
  let key = mainKey;
  const symbolMap: Record<string, string> = {
    '=': 'Equal', '+': 'Equal',
    '-': 'Minus', '_': 'Minus',
    'ๆ': 'Equal',
    '-_': 'Minus',
    'plus': 'Equal', 'underscore': 'Minus',
    ' ': 'Space', 'space': 'Space',
    'enter': 'Enter', 'return': 'Enter',
    'tab': 'Tab', 'esc': 'Escape', 'escape': 'Escape',
    'backspace': 'Backspace', 'delete': 'Delete',
    'up': 'ArrowUp', 'down': 'ArrowDown', 'left': 'ArrowLeft', 'right': 'ArrowRight',
  };
  if (key) {
    let k = key.trim();
    if (symbolMap[k.toLowerCase()]) {
      key = symbolMap[k.toLowerCase()];
    } else if (/^f\d{1,2}$/i.test(k)) {
      key = k.toUpperCase();
    } else if (/^[a-z]$/i.test(k)) {
      key = k.toUpperCase();
    } else if (/^\d$/.test(k)) {
      key = k;
    }
  }
  return [...modifiers, key].filter(Boolean).join('+');
}

let isRunning = false;

// --- Update win count via Tauri command (same as typing) ---
export async function updateWin(delta: number) {
  if (isRunning) return;
  isRunning = true;
  
  try {
    // Get current win count from Tauri state (NOT store)
    const currentState = await invoke('get_win_state') as any;
    const currentWin = currentState.win || 0;
    const newVal = Math.max(-10000, Math.min(10000, currentWin + delta));
    
    console.log(`🎹 Hotkey: ${currentWin} + ${delta} = ${newVal} (from Tauri state)`);
    
    // Use Tauri command to set win (same as typing)
    await invoke('set_win', { value: newVal });
    
    // Play sound async (non-blocking) - with debug logging
    console.log('🔊 Playing sound for delta:', delta);
    if (delta > 0) {
      if (delta === 1) {
        console.log('🔊 Playing increase sound');
        audioManager.play('increase');
      } else {
        console.log('🔊 Playing increment10 sound');
        audioManager.play('increment10');
      }
    } else {
      if (delta === -1) {
        console.log('🔊 Playing decrease sound');
        audioManager.play('decrease');
      } else {
        console.log('🔊 Playing decrement10 sound');
        audioManager.play('decrement10');
    }
    }
    
    console.log(`✅ Hotkey: Win count updated to ${newVal} via Tauri`);
  } catch (error) {
    console.error('❌ Hotkey: Failed to update win count:', error);
  }
  
  setTimeout(() => { isRunning = false; }, 50);
}

let registeredShortcuts: string[] = [];

// Unregister all hotkeys (Tauri global shortcut)
export async function unregisterAllHotkeys() {
  for (const shortcut of registeredShortcuts) {
    try {
      await invoke('plugin:global-shortcut|unregister', { shortcut });
    } catch (e) {
      // ignore
    }
  }
  registeredShortcuts = [];
}

// Check for hotkey conflicts in settings
export function getHotkeyConflicts(settings = get(hotkeySettings)) {
  const used: string[] = [];
  const conflicts: string[] = [];
  for (const action of Object.values(settings.actions)) {
    const str = keybindToString(action.currentKeybind);
    if (used.includes(str)) conflicts.push(str);
    else used.push(str);
  }
  return conflicts;
}

// Register hotkeys from settings (dynamic)
export async function registerHotkeysFromSettings() {
  // DISABLED: Rust backend handles hotkeys directly to avoid conflicts
  // await unregisterAllHotkeys();
  // const settings = get(hotkeySettings);
  // if (!settings.enabled) return;
  
  console.log('🚫 Frontend hotkey registration disabled - using Rust backend hotkeys');
  console.log('🔧 To re-enable, modify registerHotkeysFromSettings() in hotkeyManager.ts');
  
  // TODO: Integrate with Rust backend hotkey system
  // For now, hotkeys are handled directly in main.rs
  return;
}

// --- Register hotkeys globally and fallback locally ---
export async function registerHotkeys() {
  // Mapping: shortcut string (normalized) → delta
  const hotkeyMap: Record<string, number> = {
    [normalizeShortcut('Alt+=')]: 1,
    [normalizeShortcut('Alt+-')]: -1,
    [normalizeShortcut('Alt+Shift+=')]: 10,
    [normalizeShortcut('Alt+Shift+-')]: -10,
  };
  // Register with Tauri global shortcut (robust, via invoke)
  for (const [shortcut, delta] of Object.entries(hotkeyMap)) {
    try {
      await invoke('plugin:global-shortcut|register', {
        shortcut,
      });
      // Listen for backend event (should be handled in Tauri backend)
      window.addEventListener('tauri-hotkey', (e: any) => {
        if (e.detail && e.detail.shortcut === shortcut) {
          console.log('Hotkey triggered (Tauri):', shortcut, delta);
          updateWin(delta);
        }
      });
    } catch (e) {
      // Fallback: local keydown if Tauri fails
      window.addEventListener('keydown', (event) => {
        const target = event.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
        const mods = [];
        if (event.ctrlKey) mods.push('Ctrl');
        if (event.altKey) mods.push('Alt');
        if (event.shiftKey) mods.push('Shift');
        if (event.metaKey) mods.push('Meta');
        const shortcutStr = [...mods, event.key].filter(Boolean).join('+');
        const normalized = normalizeShortcut(shortcutStr);
        if (hotkeyMap[normalized] !== undefined) {
          console.log('Hotkey triggered (fallback):', normalized, hotkeyMap[normalized]);
          updateWin(hotkeyMap[normalized]);
          event.preventDefault();
        } else {
          console.warn('Fallback shortcut ignored:', event.code);
        }
      });
    }
  }
}
