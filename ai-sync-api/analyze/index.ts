// Analyze module for AI Sync API
import { WinState, SyncEvent } from '../types';

export function analyzeChange(prev: WinState, next: WinState): SyncEvent | null {
  if (prev.wins !== next.wins) {
    return {
      type: 'win-update',
      payload: { wins: next.wins },
      source: 'analyze',
      timestamp: Date.now(),
    };
  }
  return null;
}
