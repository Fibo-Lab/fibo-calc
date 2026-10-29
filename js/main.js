// Punt d'entrada: crea els serveis compartits, registra els mòduls i munta la interfície.

import { createStore } from './core/store.js';
import { createI18n, detectLanguage, LANGUAGES } from './core/i18n.js';
import { createEngine } from './core/engine.js';
import { createHistory } from './core/history.js';
import { registerModule, getModules, getModule } from './core/registry.js';
import { createHistoryPanel } from './ui/history-panel.js';
import { createToast } from './ui/toast.js';

import calculator from './modules/calculator/index.js';
// Mòduls futurs: crea la carpeta corresponent i descomenta'ls (vegeu README.md).
// import graphs from './modules/graphs/index.js';
// import stats from './modules/stats/index.js';

registerModule(calculator);
// registerModule(graphs);
// registerModule(stats);

const store = createStore('calc.settings', {
  lang: detectLanguage(),
  angle: 'deg',
  resultMode: 'exact',
  module: 'calculator',
});
const i18n = createI18n(store);
const engine = createEngine(window.math, store.get);
const history = createHistory('calc.history', 100);
const toast = createToast(document.querySelector('.toasts'));
const ctx = { math: window.math, engine, store, i18n, history, toast };

for (const mod of getModules()) if (mod.i18n) i18n.extend(mod.i18n);

// --- Selector d'idioma ---
const langSelect = document.querySelector('#lang');
langSelect.replaceChildren(...LANGUAGES.map(({ code, name }) => new Option(name, code)));
langSelect.value = store.get().lang;
langSelect.addEventListener('change', () => store.set({ lang: langSelect.value }));

// --- Pestanyes de mòduls (només es mostren si n'hi ha més d'un) ---
const tabs = document.querySelector('.tabs');
const view = document.querySelector('#view');
let current = null;

function renderTabs() {
  const mods = getModules();
  tabs.hidden = mods.length < 2;
  tabs.replaceChildren(...mods.map((mod) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(mod.id === current?.id));
    b.addEventListener('click', () => store.set({ module: mod.id }));
    if (mod.icon) b.insertAdjacentHTML('afterbegin', mod.icon);
    const label = document.createElement('span');
    label.dataset.i18n = mod.titleKey;
    b.append(label);
    return b;
  }));
  i18n.apply(tabs);
}

function showModule(id) {
  const mod = getModule(id) || getModules()[0];
  if (current === mod) return;
  current?.unmount?.();
  view.replaceChildren();
  view.dataset.module = mod.id;
  current = mod;
  mod.mount(view, ctx);
  i18n.apply(view);
  renderTabs();
}

// --- Historial ---
createHistoryPanel(document.querySelector('#history'), {
  history, store, i18n,
  onPick(entry, what) {
    if (entry.module && entry.module !== current.id && getModule(entry.module)) store.set({ module: entry.module });
    current.onHistoryPick?.(entry, what);
  },
});

store.subscribe((state, changed) => {
  if (changed.includes('module')) showModule(state.module);
  if (changed.includes('lang')) {
    langSelect.value = state.lang;
    i18n.apply();
    document.title = i18n.t('app.title');
    for (const mod of getModules()) mod.onLanguageChange?.();
  }
});

showModule(store.get().module);
i18n.apply();
document.title = i18n.t('app.title');

// --- Service worker (funcionament sense connexió) ---
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      const firstInstall = !navigator.serviceWorker.controller;
      const offerUpdate = (worker) => toast(i18n.t('app.updateReady'), {
        timeout: 0,
        action: { label: i18n.t('app.update'), onClick: () => worker.postMessage('skipWaiting') },
      });
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state !== 'installed') return;
          if (navigator.serviceWorker.controller) offerUpdate(worker);
          else if (firstInstall) toast(i18n.t('app.offlineReady'));
        });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!firstInstall && !reloading) {
          reloading = true;
          location.reload();
        }
      });
    } catch (err) {
      console.warn('No s’ha pogut registrar el service worker', err);
    }
  });
}
