import { writable } from 'svelte/store';

export const presetName = writable('PRESET');
export const tauriWin = writable<{ win: number; goal?: number }>({ win: 0 });
