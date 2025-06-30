// State management for AI Sync API
import { WinState } from '../types';

let currentState: WinState = {
  wins: 0,
  lastUpdated: Date.now(),
};

export function getState(): WinState {
  return currentState;
}

export function setState(newState: WinState) {
  currentState = newState;
}
