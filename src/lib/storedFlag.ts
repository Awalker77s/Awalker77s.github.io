import { useSyncExternalStore } from "react";

// On/off preferences that default ON: only an explicit stored "off" disables
// one. Read through useSyncExternalStore so the prerendered HTML and the
// hydrating client agree on "on" (no hydration mismatch, no flash of unlit
// controls for the common case) and a stored "off" is applied right after.

const listeners = new Set<() => void>();
// Storage can be unavailable or throw (blocked site data, some private
// modes). The session then keeps its choices in memory instead of crashing.
const memory = new Map<string, boolean>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changing a preference applies here too.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readStoredFlag(key: string): boolean {
  const remembered = memory.get(key);
  if (remembered !== undefined) return remembered;
  try {
    return window.localStorage.getItem(key) !== "off";
  } catch {
    return true;
  }
}

export function writeStoredFlag(key: string, on: boolean) {
  memory.set(key, on);
  try {
    window.localStorage.setItem(key, on ? "on" : "off");
    // Storage accepted the write, so it is the source of truth again (keeps
    // cross-tab changes flowing through the "storage" event).
    memory.delete(key);
  } catch {
    // Kept in memory for this session.
  }
  for (const listener of listeners) listener();
}

export function removeStoredKey(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing stored, nothing to remove.
  }
}

export function useStoredFlag(key: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => readStoredFlag(key),
    () => true,
  );
}
