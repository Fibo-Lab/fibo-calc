// Diàleg d'ajustos: tria de tema (amb miniatures) i d'idioma.
// Cada miniatura rep les variables del seu tema com a estil en línia, de manera que
// es dibuixa amb les mateixes regles CSS que l'app: si s'afegeix un tema a presets.js,
// apareix aquí sol.

import { PICKER_ORDER } from '../themes/presets.js';

function preview(vars) {
  const box = document.createElement('div');
  box.className = 'tc-preview';
  box.setAttribute('aria-hidden', 'true');
  for (const [k, v] of Object.entries(vars)) box.style.setProperty(k, v);
  const screen = document.createElement('div');
  screen.className = 'tc-screen';
  screen.textContent = '¾';
  const keys = document.createElement('div');
  keys.className = 'tc-keys';
  for (let i = 0; i < 4; i++) keys.append(document.createElement('span'));
  box.append(screen, keys);
  return box;
}

export function createSettings(dialog, { store, i18n, themes, languages }) {
  const t = i18n.t;
  const grid = dialog.querySelector('.theme-grid');
  const langSelect = dialog.querySelector('#lang');

  langSelect.replaceChildren(...languages.map(({ code, name }) => new Option(name, code)));
  langSelect.addEventListener('change', () => store.set({ lang: langSelect.value }));

  function themeIds() {
    const custom = Object.keys(store.get().customThemes || {});
    return [...PICKER_ORDER, ...custom.filter((id) => !PICKER_ORDER.includes(id))];
  }

  function renderThemes() {
    const selected = store.get().theme || 'auto';
    const lang = i18n.lang();
    grid.replaceChildren(...themeIds().map((id) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'theme-card';
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', String(id === selected));
      card.dataset.theme = id;
      if (id === 'auto') {
        const split = document.createElement('div');
        split.className = 'tc-preview tc-auto';
        split.append(preview(themes.resolve('light').vars), preview(themes.resolve('dark').vars));
        card.append(split);
      } else {
        card.append(preview(themes.resolve(id).vars));
      }
      const name = document.createElement('span');
      name.className = 'tc-name';
      const def = themes.themes()[id];
      name.textContent = id === 'auto' ? t('theme.auto') : (def?.name?.[lang] ?? def?.name?.ca ?? id);
      const hint = document.createElement('span');
      hint.className = 'tc-hint';
      hint.textContent = t(`theme.hint.${id}`) === `theme.hint.${id}` ? '' : t(`theme.hint.${id}`);
      card.append(name, hint);
      card.addEventListener('click', () => {
        themes.set(id);
        grid.querySelectorAll('.theme-card').forEach((c) => c.setAttribute('aria-checked', String(c === card)));
      });
      return card;
    }));
  }

  function refresh() {
    langSelect.value = store.get().lang;
    renderThemes();
  }

  dialog.querySelector('[data-action="settings-close"]').addEventListener('click', () => dialog.close());
  // Tocar fora del quadre (al fons) el tanca.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  refresh();
  return {
    refresh,
    open() {
      refresh();
      dialog.showModal();
      grid.querySelector('[aria-checked="true"]')?.focus();
    },
  };
}
