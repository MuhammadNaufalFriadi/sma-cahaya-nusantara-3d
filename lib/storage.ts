import { SaveState } from "./types";

const SAVE_KEY = "sma-cn-world-v1";

export function loadSaveState(): SaveState {
  const defaultState: SaveState = { v: {}, f: {}, s: {}, gate: 0, night: 0 };
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState;
    return Object.assign(defaultState, JSON.parse(raw));
  } catch (e) {
    return defaultState;
  }
}

export function writeSaveState(state: SaveState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        v: state.v,
        f: state.f,
        s: state.s,
        gate: state.gate,
        night: state.night,
      })
    );
  } catch (e) {}
}

