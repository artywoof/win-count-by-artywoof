import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

// --- ศูนย์กลางข้อมูลหลักของแอปพลิเคชัน ---

// ค่า Win และ Goal
export const win: Writable<number> = writable(0);
export const goal: Writable<number> = writable(10);

// สถานะการแสดงผล
export const showGoal: Writable<boolean> = writable(true);
export const showCrown: Writable<boolean> = writable(true);

// การจัดการ Preset
export const presets: Writable<string[]> = writable(['Default']);
export const currentPreset: Writable<string> = writable('Default');

// สถานะการเปิด/ปิดหน้าต่าง Modal
export const showSettingsModal: Writable<boolean> = writable(false);
export const showPresetModal: Writable<boolean> = writable(false);

// การตั้งค่าเสียง
export const audioEnabled: Writable<boolean> = writable(true);
export const audioVolume: Writable<number> = writable(0.5);

// 참고: ส่วนของการตั้งค่า Hotkey สามารถเก็บไว้ในไฟล์นี้ต่อไปได้
// หากต้องการ Refactor ในอนาคตก็สามารถทำได้เช่นกัน 