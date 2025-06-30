// Shared types for AI Sync API

export interface WinState {
  wins: number;
  lastUpdated: number; // Unix timestamp
}

export interface SyncEvent {
  type: 'win-update' | 'preset-update' | 'custom';
  payload: any;
  source: string;
  timestamp: number;
}
