import { presetName } from './stores';

const PRESET_DIR = 'presets';
const LAST_USED_KEY = 'win-count-last-preset';
const DEFAULT_PRESET = {
  name: 'Default',
  win: 0,
  goal: 5,
  showCrown: true,
  showGoal: true,
  hotkeys: {
    increase: 'Alt+Equal',
    decrease: 'Alt+Minus'
  }
};

function isTauri() {
  return Boolean((import.meta as any).env.TAURI_PLATFORM);
}

let tauriFs: any = null;

async function ensureTauriFs() {
  if (!isTauri()) throw new Error('Tauri FS API not available in browser');
  if (!tauriFs) {
    // Use eval to prevent Vite from analyzing the import
    tauriFs = await (0, eval)(`import('@tauri-apps/api/fs')`).then((m: any) => m);
  }
  return tauriFs;
}

export async function ensurePresetDir() {
  if (!isTauri()) return;
  const { createDir, BaseDirectory } = await ensureTauriFs();
  try {
    await createDir(PRESET_DIR, { dir: BaseDirectory.App, recursive: true });
  } catch (e) {
    // Ignore if already exists
  }
}

export async function listPresets() {
  if (!isTauri()) return [];
  const { readDir, BaseDirectory } = await ensureTauriFs();
  await ensurePresetDir();
  const files = await readDir(PRESET_DIR, { dir: BaseDirectory.App });
  return files.filter((f: any) => f.name?.endsWith('.json')).map((f: any) => f.name?.replace('.json', ''));
}

export async function readPreset(name: string) {
  if (!isTauri()) return DEFAULT_PRESET;
  const { readTextFile, BaseDirectory } = await ensureTauriFs();
  await ensurePresetDir();
  try {
    const text = await readTextFile(`${PRESET_DIR}/${name}.json`, { dir: BaseDirectory.App });
    return JSON.parse(text);
  } catch (e) {
    if (name === 'Default') {
      await writePreset('Default', DEFAULT_PRESET);
      return DEFAULT_PRESET;
    }
    throw e;
  }
}

export async function writePreset(name: string, data: any) {
  if (!isTauri()) return;
  const { writeFile, BaseDirectory } = await ensureTauriFs();
  await ensurePresetDir();
  await writeFile({
    path: `${PRESET_DIR}/${name}.json`,
    contents: JSON.stringify({ ...data, name }, null, 2),
  }, { dir: BaseDirectory.App });
}

export async function savePreset(name: string, data: any) {
  return await writePreset(name, data);
}

export async function ensureDefaultPreset() {
  if (!isTauri()) return;
  await ensurePresetDir();
  try {
    await readPreset('Default');
  } catch {
    await writePreset('Default', DEFAULT_PRESET);
  }
}

export function saveLastUsedPreset(name: string) {
  localStorage.setItem(LAST_USED_KEY, name);
  presetName.set(name);
}

export function getLastUsedPreset(): string {
  return localStorage.getItem(LAST_USED_KEY) || 'Default';
}

export async function loadPreset(name: string) {
  return await readPreset(name);
}

export async function restoreDefaultPreset() {
  return await loadPreset("default");
}
