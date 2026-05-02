/**
 * Storage abstraction that falls back to in-memory when
 * localStorage is blocked (Safari ITP, private browsing, etc.)
 */
const memoryStore = new Map<string, string>();
let useMemory = false;

function checkLocalStorage(): boolean {
  try {
    const key = "__cb_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// Check once at load time
useMemory = !checkLocalStorage();

export function getItem(key: string): string | null {
  if (useMemory) return memoryStore.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    useMemory = true;
    return memoryStore.get(key) ?? null;
  }
}

export function setItem(key: string, value: string): void {
  if (useMemory) { memoryStore.set(key, value); return; }
  try {
    localStorage.setItem(key, value);
  } catch {
    useMemory = true;
    memoryStore.set(key, value);
  }
}

export function removeItem(key: string): void {
  if (useMemory) { memoryStore.delete(key); return; }
  try {
    localStorage.removeItem(key);
  } catch {
    useMemory = true;
    memoryStore.delete(key);
  }
}

// ---- Trigger cooldown helpers ----

/**
 * Cooldown policy for manual agent triggers.
 *  - "session": once per browser session (sessionStorage)
 *  - "once":    once forever per device (localStorage)
 *  - {minutes}: timestamp-based, stored in localStorage
 *  - null:      no cooldown, always fire
 */
export type CooldownPolicy =
  | "session"
  | "once"
  | { minutes: number }
  | null;

const TRIGGER_KEY_PREFIX = "zephlo_trigger_";

function sessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function sessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

/** Returns true if a trigger with this id may fire right now. */
export function shouldFire(id: string, policy: CooldownPolicy): boolean {
  if (policy === null) return true;
  const key = TRIGGER_KEY_PREFIX + id;

  if (policy === "session") {
    return sessionGet(key) === null;
  }
  if (policy === "once") {
    return getItem(key) === null;
  }
  // { minutes: N }
  const raw = getItem(key);
  if (!raw) return true;
  const last = Number(raw);
  if (!Number.isFinite(last)) return true;
  const elapsedMs = Date.now() - last;
  return elapsedMs >= policy.minutes * 60 * 1000;
}

/** Record that a trigger with this id just fired. */
export function recordFire(id: string, policy: CooldownPolicy): void {
  if (policy === null) return;
  const key = TRIGGER_KEY_PREFIX + id;

  if (policy === "session") {
    sessionSet(key, "1");
    return;
  }
  // "once" and {minutes} both use localStorage with a timestamp
  setItem(key, String(Date.now()));
}
