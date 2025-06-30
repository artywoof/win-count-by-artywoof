// Overlay watcher for UI state changes
import { WinState } from '../types';
import { getState, setState } from '../state';
import { analyzeChange } from '../analyze';
import { notifyToMain } from '../notify/toMain';

// Simulate watching for overlay state changes (replace with real integration)
export function watchOverlayState(newOverlayState: WinState) {
  const prev = getState();
  setState(newOverlayState);
  const event = analyzeChange(prev, newOverlayState);
  if (event) {
    notifyToMain(event);
  }
}
