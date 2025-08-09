import { writable, get } from 'svelte/store';
import { audioManager } from '../audio/audioManager';
import { invoke } from '@tauri-apps/api/core';
import { hotkeySettings, type Keybind, keybindToString, keybindEquals } from '../stores';

export function normalizeShortcut(shortcut: string): string {
  if (!shortcut || typeof shortcut !== 'string') return '';
  let parts = shortcut.split('+').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  const modMap: Record<string, string> = { 'control': 'Ctrl', 'ctrl': 'Ctrl', 'alt': 'Alt', 'shift': 'Shift', 'meta': 'Meta', 'cmd': 'Meta', 'command': 'Meta', 'win': 'Meta' };
  const modifiers: string[] = [];
  let mainKey = '';
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (modMap[lower]) { if (!modifiers.includes(modMap[lower])) modifiers.push(modMap[lower]); } else { mainKey = part; }
  }
  const modOrder = ['Ctrl', 'Alt', 'Shift', 'Meta'];
  modifiers.sort((a, b) => modOrder.indexOf(a) - modOrder.indexOf(b));
  let key = mainKey;
  const symbolMap: Record<string, string> = { '=': 'Equal', '+': 'Equal', '-': 'Minus', '_': 'Minus', ' ': 'Space', 'space': 'Space', 'enter': 'Enter', 'return': 'Enter', 'tab': 'Tab', 'esc': 'Escape', 'escape': 'Escape', 'backspace': 'Backspace', 'delete': 'Delete', 'up': 'ArrowUp', 'down': 'ArrowDown', 'left': 'ArrowLeft', 'right': 'ArrowRight' };
  if (key) {
    let k = key.trim();
    if (symbolMap[k.toLowerCase()]) key = symbolMap[k.toLowerCase()];
    else if (/^f\d{1,2}$/i.test(k)) key = k.toUpperCase();
    else if (/^[a-z]$/i.test(k)) key = k.toUpperCase();
    else if (/^\d$/.test(k)) key = k;
  }
  return [...modifiers, key].filter(Boolean).join('+');
}

let isRunning = false;
export async function updateWin(delta: number) {
  if (isRunning) return; isRunning = true;
  try {
    const currentState = await invoke('get_win_state') as any;
    const currentWin = currentState.win || 0;
    const newVal = Math.max(-10000, Math.min(10000, currentWin + delta));
    await invoke('set_win', { value: newVal });
    if (delta > 0) { delta === 1 ? audioManager.play('increase') : audioManager.play('increment10'); }
    else { delta === -1 ? audioManager.play('decrease') : audioManager.play('decrement10'); }
  } catch (error) { console.error('Hotkey update failed:', error); }
  setTimeout(() => { isRunning = false; }, 50);
}

let registeredShortcuts: string[] = [];
export async function unregisterAllHotkeys() {
  for (const shortcut of registeredShortcuts) { try { await invoke('plugin:global-shortcut|unregister', { shortcut }); } catch {} }
  registeredShortcuts = [];
}

export function getHotkeyConflicts(settings = get(hotkeySettings)) {
  const used: string[] = []; const conflicts: string[] = [];
  for (const action of Object.values(settings.actions)) {
    if (action && action.currentKeybind) {
      const str = keybindToString(action.currentKeybind);
      if (str && used.includes(str)) conflicts.push(str); else if (str) used.push(str);
    }
  }
  return conflicts;
}

export async function registerHotkeysFromSettings() {
  try {
    const settings = get(hotkeySettings);
    if (!settings.enabled) return;
    const hotkeyMap: Record<string, string> = {};
    for (const [actionId, action] of Object.entries(settings.actions)) {
      if (action && action.currentKeybind) {
        const hotkeyString = keybindToString(action.currentKeybind);
        if (hotkeyString) hotkeyMap[actionId] = convertToBackendFormat(hotkeyString);
      }
    }
    for (const [action, hotkey] of Object.entries(hotkeyMap)) {
      try { await invoke('update_hotkey', { action, hotkey }); } catch (e) { console.error('Failed to send hotkey', action, e); }
    }
    try { await invoke('reload_hotkeys_command'); } catch (e) { console.error('Failed to reload hotkeys', e); }
  } catch (e) { console.error('registerHotkeysFromSettings error', e); }
}

function convertToBackendFormat(displayFormat: string): string {
  let backendFormat = displayFormat.replace(/\s+/g, '');
  const specialCharMap: Record<string, string> = { '=': 'Equal', '-': 'Minus', Space: 'Space', Up: 'ArrowUp', Down: 'ArrowDown', Left: 'ArrowLeft', Right: 'ArrowRight' };
  return backendFormat.split('+').map((p) => specialCharMap[p] || p).join('+');
}

export async function registerHotkeys() {
  const hotkeyMap: Record<string, number> = {
    [normalizeShortcut('Alt+=')]: 1,
    [normalizeShortcut('Alt+-')]: -1,
    [normalizeShortcut('Alt+Shift+=')]: 10,
    [normalizeShortcut('Alt+Shift+-')]: -10,
  };
  for (const [shortcut, delta] of Object.entries(hotkeyMap)) {
    try {
      await invoke('plugin:global-shortcut|register', { shortcut });
      window.addEventListener('tauri-hotkey', (e: any) => {
        if (e.detail && e.detail.shortcut === shortcut) updateWin(delta);
      });
    } catch (e) {
      window.addEventListener('keydown', (event) => {
        const target = event.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
        const mods = [] as string[];
        if (event.ctrlKey) mods.push('Ctrl');
        if (event.altKey) mods.push('Alt');
        if (event.shiftKey) mods.push('Shift');
        if (event.metaKey) mods.push('Meta');
        const shortcutStr = [...mods, event.key].filter(Boolean).join('+');
        const normalized = normalizeShortcut(shortcutStr);
        if (hotkeyMap[normalized] !== undefined) { updateWin(hotkeyMap[normalized]); event.preventDefault(); }
      });
    }
  }
}


