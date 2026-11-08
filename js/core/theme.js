// Gestor de temes: aplica el tema triat (store.theme) com a variables CSS a <html>.
//
// - Els temes són dades (js/themes/presets.js); aquí només s'apliquen.
// - "auto" segueix el sistema (prefers-color-scheme) i reacciona quan canvia.
// - Desa una còpia del tema resolt a localStorage perquè l'script del <head>
//   el pinti abans del primer fotograma (sense parpelleig de colors).
// - Emet window 'themechange' (detail = tema resolt) perquè els <canvas> es redibuixin.

import { PRESETS } from '../themes/presets.js';
import { resolveTheme } from '../themes/resolve.js';
import { writeStorage } from './store.js';

export const THEME_CACHE_KEY = 'calc.themeCache';

export function createThemeManager(store, { presets = PRESETS } = {}) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  let applied = [];
  let current = null;

  const all = () => ({ ...presets, ...(store.get().customThemes || {}) });
  const resolve = (id) => resolveTheme(id, all(), { prefersDark: mq.matches });

  function apply() {
    const t = resolve(store.get().theme || 'auto');
    for (const name of applied) if (!(name in t.vars)) root.style.removeProperty(name);
    for (const [name, value] of Object.entries(t.vars)) root.style.setProperty(name, value);
    applied = Object.keys(t.vars);
    root.dataset.theme = t.id;
    root.dataset.fx = t.fx.join(' ');
    root.style.colorScheme = t.scheme;
    let meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.append(meta);
    }
    meta.content = t.tokens.color.bg;
    writeStorage(THEME_CACHE_KEY, { id: t.id, vars: t.vars, fx: t.fx, scheme: t.scheme });
    current = t;
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }

  mq.addEventListener('change', () => {
    if ((store.get().theme || 'auto') === 'auto') apply();
  });
  store.subscribe((_, changed) => {
    if (changed.includes('theme') || changed.includes('customThemes')) apply();
  });

  return {
    apply,
    resolve,
    themes: all,
    current: () => current,
    set: (id) => store.set({ theme: id }),
  };
}
