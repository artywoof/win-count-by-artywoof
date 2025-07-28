import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

// --- ศูนย์กลางข้อมูลหลักของแอปพลิเคชัน ---

// --- 1. ส่วนข้อมูลทั่วไป (General App State) ---
export const win: Writable<number> = writable(0);
export const goal: Writable<number> = writable(10);
export const showGoal: Writable<boolean> = writable(true);
export const showCrown: Writable<boolean> = writable(true);
export const presets: Writable<string[]> = writable(['Default']);
export const currentPreset: Writable<string> = writable('Default');
export const presetName: Writable<string> = writable('Default');
export const showSettingsModal: Writable<boolean> = writable(false);
export const showPresetModal: Writable<boolean> = writable(false);

// --- 2. ส่วนข้อมูลคีย์ลัด (Hotkey Settings) - ส่วนที่หายไป! ---

/**
 * โครงสร้างของปุ่มกด (Keybind)
 * @property {string} code - รหัสของปุ่ม (เช่น 'KeyA', 'Digit1', 'NumpadEnter')
 * @property {boolean} alt - กดปุ่ม Alt ค้างไว้หรือไม่
 * @property {boolean} shift - กดปุ่ม Shift ค้างไว้หรือไม่
 * @property {boolean} ctrl - กดปุ่ม Control ค้างไว้หรือไม่
 * @property {boolean} meta - กดปุ่ม Meta (Windows/Command) ค้างไว้หรือไม่
 */
export interface Keybind {
  code: string;
  alt: boolean;
  shift: boolean;
  ctrl: boolean;
  meta: boolean;
}

/**
 * โครงสร้างของการกระทำ (Action) แต่ละอย่าง
 */
export interface HotkeyAction {
  label: string;
  description: string;
  defaultKeybind: Keybind;
  currentKeybind: Keybind;
}

/**
 * โครงสร้างของการตั้งค่าคีย์ลัดทั้งหมด
 */
interface HotkeySettings {
  enabled: boolean;
  actions: {
    increment: HotkeyAction;
    decrement: HotkeyAction;
    increment10: HotkeyAction;
    decrement10: HotkeyAction;
    reset: HotkeyAction;
    toggleGoal: HotkeyAction;
    [key: string]: HotkeyAction; // Index signature for dynamic access
  };
}

// ค่าเริ่มต้นของคีย์ลัดทั้งหมด
const defaultHotkeys: HotkeySettings = {
  enabled: true,
  actions: {
    increment: {
      label: '🔺 เพิ่มค่า (+1)',
      description: 'เพิ่มค่าชัยชนะทีละ 1',
      defaultKeybind: { code: 'Equal', alt: true, shift: false, ctrl: false, meta: false },
      currentKeybind: { code: 'Equal', alt: true, shift: false, ctrl: false, meta: false },
    },
    decrement: {
      label: '🔻 ลดค่า (-1)',
      description: 'ลดค่าชัยชนะทีละ 1',
      defaultKeybind: { code: 'Minus', alt: true, shift: false, ctrl: false, meta: false },
      currentKeybind: { code: 'Minus', alt: true, shift: false, ctrl: false, meta: false },
    },
    increment10: {
      label: '⬆️ เพิ่มค่า (+10)',
      description: 'เพิ่มค่าชัยชนะทีละ 10',
      defaultKeybind: { code: 'Equal', alt: true, shift: true, ctrl: false, meta: false },
      currentKeybind: { code: 'Equal', alt: true, shift: true, ctrl: false, meta: false },
    },
    decrement10: {
      label: '⬇️ ลดค่า (-10)',
      description: 'ลดค่าชัยชนะทีละ 10',
      defaultKeybind: { code: 'Minus', alt: true, shift: true, ctrl: false, meta: false },
      currentKeybind: { code: 'Minus', alt: true, shift: true, ctrl: false, meta: false },
    },
    reset: {
      label: '🔄 รีเซ็ตค่า',
      description: 'รีเซ็ตค่าชัยชนะเป็น 0',
      defaultKeybind: { code: '', alt: false, shift: false, ctrl: false, meta: false }, // ไม่มีค่าเริ่มต้น
      currentKeybind: { code: '', alt: false, shift: false, ctrl: false, meta: false },
    },
    toggleGoal: {
      label: '🎯 สลับเป้าหมาย',
      description: 'แสดง/ซ่อนเป้าหมาย',
      defaultKeybind: { code: '', alt: false, shift: false, ctrl: false, meta: false }, // ไม่มีค่าเริ่มต้น
      currentKeybind: { code: '', alt: false, shift: false, ctrl: false, meta: false },
    },
  },
};

// ฟังก์ชันสำหรับสร้าง Store ของ Hotkey
function createHotkeyStore() {
  const { subscribe, set, update } = writable<HotkeySettings>(JSON.parse(JSON.stringify(defaultHotkeys))); // ใช้ deep copy

  return {
    subscribe,
    set,
    update,
    // ฟังก์ชันสำหรับรีเซ็ตกลับไปเป็นค่าเริ่มต้น
    resetToDefaults: () => {
      console.log('stores.ts: resetToDefaults called!');
      set(JSON.parse(JSON.stringify(defaultHotkeys))); // ใช้ deep copy เพื่อป้องกัน reference bug
    },
  };
}

// สร้างและ export ตัว Store หลัก
export const hotkeySettings = createHotkeyStore();


// --- 3. ฟังก์ชันตัวช่วย (Helper Functions) ---

/**
 * แปลง Object ของ Keybind ให้เป็น String ที่อ่านง่าย (เช่น 'Alt + Shift + A')
 * @param keybind - Object ที่ต้องการแปลง
 * @returns - String ของคีย์ลัด
 */
export function keybindToString(keybind: Partial<Keybind>): string {
  if (!keybind || !keybind.code) {
    return 'ไม่ได้ตั้งค่า';
  }

  const parts: string[] = [];
  if (keybind.ctrl) parts.push('Ctrl');
  if (keybind.alt) parts.push('Alt');
  if (keybind.shift) parts.push('Shift');
  if (keybind.meta) parts.push('Meta');

  // แปลงรหัสปุ่มพิเศษให้อ่านง่ายขึ้น
  const keyDisplayMap: { [key: string]: string } = {
    'Equal': '=',
    'Minus': '-',
    'Space': 'Space',
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
  };

  const displayKey = keyDisplayMap[keybind.code] || keybind.code.replace('Key', '').replace('Digit', '');
  parts.push(displayKey);

  return parts.join(' + ');
}

/**
 * เปรียบเทียบ Keybind สองอันว่าเหมือนกันหรือไม่
 * @param kb1 - Keybind อันที่ 1
 * @param kb2 - Keybind อันที่ 2
 * @returns - true ถ้าเหมือนกัน, false ถ้าไม่เหมือน
 */
export function keybindEquals(kb1: Partial<Keybind>, kb2: Partial<Keybind>): boolean {
    if (!kb1 || !kb2) return false;
    return (
        kb1.code === kb2.code &&
        !!kb1.alt === !!kb2.alt &&
        !!kb1.shift === !!kb2.shift &&
        !!kb1.ctrl === !!kb2.ctrl &&
        !!kb1.meta === !!kb2.meta
    );
}
