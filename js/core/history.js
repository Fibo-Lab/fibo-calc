// Historial d'operacions compartit, persistent a localStorage.
// Cada entrada: { id, module, tokens, exprText, exactText, decimalText, time }

import { readStorage, writeStorage } from './store.js';

export function createHistory(key, max = 100) {
  let items = readStorage(key, []);
  if (!Array.isArray(items)) items = [];
  const listeners = new Set();

  function emit() {
    writeStorage(key, items);
    listeners.forEach((fn) => fn(items));
  }

  return {
    list: () => items,
    add(entry) {
      const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), time: Date.now(), ...entry };
      items = [item, ...items].slice(0, max);
      emit();
      return item;
    },
    remove(id) {
      items = items.filter((i) => i.id !== id);
      emit();
    },
    clear() {
      items = [];
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
