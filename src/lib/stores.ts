import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';

// --- Main Application State ---
export const win: Writable<number> = writable(0);
export const goal: Writable<number> = writable(10);
export const showGoal: Writable<boolean> = writable(true);
export const showCrown: Writable<boolean> = writable(true);

// --- Preset Management State ---
export const presets: Writable<string[]> = writable(['Default']);
export const currentPreset: Writable<string> = writable('Default');

// --- UI State ---
export const showSettingsModal: Writable<boolean> = writable(false);
export const showPresetModal: Writable<boolean> = writable(false);
export const showHotkeySettings: Writable<boolean> = writable(false);
export const showAudioSettings: Writable<boolean> = writable(false);

// --- Audio State ---
export const audioEnabled: Writable<boolean> = writable(true);
export const audioVolume: Writable<number> = writable(0.5);

// --- Hotkey State (can be expanded later) ---
// This part can remain complex as it is specific to hotkeys
export interface Keybind {
  code: string;
  alt: boolean;
  shift: boolean;
  ctrl: boolean;
  meta: boolean;
}

export interface HotkeyAction {
  id: string;
  label: string;
  defaultKeybind: Keybind;
  currentKeybind: Keybind;
}

export interface HotkeySettings {
  enabled: boolean;
  actions: {
    increment: HotkeyAction;
    decrement: HotkeyAction;
    increment10: HotkeyAction;
    decrement10: HotkeyAction;
  };
}

const defaultHotkeySettings: HotkeySettings = {
  enabled: true,
  actions: {
    increment: {
      id: 'increment',
      label: 'Increment +1',
      defaultKeybind: { code: 'Equal', alt: true, shift: false, ctrl: false, meta: false },
      currentKeybind: { code: 'Equal', alt: true, shift: false, ctrl: false, meta: false }
    },
    decrement: {
      id: 'decrement',
      label: 'Decrement -1',
      defaultKeybind: { code: 'Minus', alt: true, shift: false, ctrl: false, meta: false },
      currentKeybind: { code: 'Minus', alt: true, shift: false, ctrl: false, meta: false }
    },
    increment10: {
      id: 'increment10',
      label: 'Increment +10',
      defaultKeybind: { code: 'Equal', alt: true, shift: true, ctrl: false, meta: false },
      currentKeybind: { code: 'Equal', alt: true, shift: true, ctrl: false, meta: false }
    },
    decrement10: {
      id: 'decrement10',
      label: 'Decrement -10',
      defaultKeybind: { code: 'Minus', alt: true, shift: true, ctrl: false, meta: false },
      currentKeybind: { code: 'Minus', alt: true, shift: true, ctrl: false, meta: false }
    }
  }
};

export function keybindToString(k: Keybind): string {
  const mods = [];
  if (k.ctrl) mods.push('Ctrl');
  if (k.alt) mods.push('Alt');
  if (k.shift) mods.push('Shift');
  if (k.meta) mods.push('Meta');
  return [...mods, k.code].join('+');
}

export function keybindEquals(a: Keybind | undefined | null, b: Keybind | undefined | null): boolean {
  if (!a || !b || !a.code || !b.code) return false;
  return a.code === b.code && a.alt === b.alt && a.shift === b.shift && a.ctrl === b.ctrl && a.meta === b.meta;
}

function loadHotkeySettings(): HotkeySettings {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('hotkeySettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle any missing properties
        return {
          ...defaultHotkeySettings,
          ...parsed,
          actions: {
            ...defaultHotkeySettings.actions,
            ...parsed.actions
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load hotkey settings:', error);
    }
  }
  return defaultHotkeySettings;
}

function createHotkeySettings() {
  const { subscribe, set, update } = writable<HotkeySettings>(loadHotkeySettings());

  return {
    subscribe,
    set,
    update,
    updateAction: (actionId: string, newKeybind: Keybind) => {
      update(settings => {
        const newSettings = {
          ...settings,
          actions: {
            ...settings.actions,
            [actionId]: {
              ...settings.actions[actionId as keyof typeof settings.actions],
              currentKeybind: newKeybind
            }
          }
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('hotkeySettings', JSON.stringify(newSettings));
        }
        return newSettings;
      });
    },
    resetToDefaults: () => {
      set(defaultHotkeySettings);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('hotkeySettings', JSON.stringify(defaultHotkeySettings));
      }
    },
    toggleEnabled: () => {
      update(settings => {
        const newSettings = { ...settings, enabled: !settings.enabled };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('hotkeySettings', JSON.stringify(newSettings));
        }
        return newSettings;
      });
    }
  };
}

export const hotkeySettings = createHotkeySettings();

// --- PATCH: Expose global broadcastState for overlay sync ---
if (typeof window !== 'undefined') {
  (window as any).__winStoreDirectUpdate = (delta: number) => {
    win.update((v) => {
      const newWin = (v || 0) + delta;
      return newWin;
    });
  };
  (window as any).broadcastState = () => {
    const state = get(win);
    if (typeof window !== 'undefined' && window.tauriSetWin) {
      window.tauriSetWin(state);
    }
    // Add overlay sync logic here if needed
  };
}
