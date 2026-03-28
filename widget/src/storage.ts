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
