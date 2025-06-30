// Entry point for AI Sync API mock/demo
import { watchAppWinState } from './watchers/appWatcher';
import { watchOverlayState } from './watchers/overlayWatcher';
import { notifyToMain } from './notify/toMain';
import { WinState } from './types';

// Mock: simulate app win state change
const newAppState: WinState = {
  wins: 5,
  lastUpdated: Date.now(),
};
console.log('--- Mock: App win state change ---');
watchAppWinState(newAppState);

// Mock: simulate overlay state change
const newOverlayState: WinState = {
  wins: 5,
  lastUpdated: Date.now(),
};
console.log('--- Mock: Overlay state change ---');
watchOverlayState(newOverlayState);

// Example: notify main directly
notifyToMain({
  type: 'win-update',
  payload: { wins: 5 },
  source: 'manual',
  timestamp: Date.now(),
});
