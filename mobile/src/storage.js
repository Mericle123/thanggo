// Cross-platform token/session storage.
// • Web (Expo web / dist): persists to localStorage, so sessions survive reloads.
// • Native: falls back to an in-memory store (add @react-native-async-storage/async-storage
//   later for native persistence — the API below is already async so it's a drop-in swap).

const mem = new Map();

const hasLocal = (() => {
  try { return typeof window !== 'undefined' && !!window.localStorage; } catch { return false; }
})();

export const storage = {
  async get(key) {
    try {
      if (hasLocal) return window.localStorage.getItem(key);
      return mem.has(key) ? mem.get(key) : null;
    } catch { return null; }
  },
  async set(key, value) {
    try {
      if (value == null) return this.del(key);
      if (hasLocal) window.localStorage.setItem(key, value);
      else mem.set(key, value);
    } catch { /* ignore */ }
  },
  async del(key) {
    try {
      if (hasLocal) window.localStorage.removeItem(key);
      else mem.delete(key);
    } catch { /* ignore */ }
  },
};
