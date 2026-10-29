// Magatzem de configuració reactiu amb persistència a localStorage.
// Qualsevol mòdul pot llegir-ne l'estat i subscriure-s'hi.

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Mode privat o emmagatzematge ple: l'app funciona igualment sense persistència.
  }
}

export function createStore(key, defaults) {
  let state = { ...defaults, ...readStorage(key, {}) };
  const listeners = new Set();

  return {
    get: () => state,
    set(patch) {
      const changed = Object.keys(patch).filter((k) => state[k] !== patch[k]);
      if (!changed.length) return;
      state = { ...state, ...patch };
      writeStorage(key, state);
      listeners.forEach((fn) => fn(state, changed));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
