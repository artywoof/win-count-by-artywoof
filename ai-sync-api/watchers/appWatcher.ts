import { WinState } from '../types';
import { getState, setState } from '../state';
import { analyzeChange } from '../analyze';
import { notifyToMain } from '../notify/toMain';

// Watch for win state changes and trigger sync event
export function watchAppWinState(newWinState: WinState) {
  const prev = getState();
  setState(newWinState);
  const event = analyzeChange(prev, newWinState);
  if (event) {
    notifyToMain(event);
  }
}
