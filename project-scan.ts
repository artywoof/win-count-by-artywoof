import { promises as fs } from 'fs';
import * as path from 'path';

// Utility to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Utility to read all JSON files in a directory
async function readAllJson(dir: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const fullPath = path.join(dir, file);
        const content = await fs.readFile(fullPath, 'utf-8');
        result[`presets/${file}`] = content;
      }
    }
  } catch {}
  return result;
}

export async function scanProject() {
  const out: Record<string, string | boolean> = {};

  // Read Svelte and Rust source files
  const filesToRead = [
    'src/routes/+page.svelte',
    'src/routes/overlay/+page.svelte',
    'src-tauri/src/lib.rs',
    'src-tauri/src/main.rs',
  ];
  for (const relPath of filesToRead) {
    try {
      out[relPath] = await fs.readFile(relPath, 'utf-8');
    } catch {
      out[relPath] = false;
    }
  }

  // Read all presets/*.json
  Object.assign(out, await readAllJson('presets'));

  // Check for font and sound assets
  out['fonts/MiSansThaiVF.ttf'] = await fileExists('static/assets/fonts/MiSansThaiVF.ttf');
  out['sounds/increase.mp3'] = await fileExists('static/assets/sfx/increase.mp3');
  out['sounds/decrease.mp3'] = await fileExists('static/assets/sfx/decrease.mp3');

  return out;
}
