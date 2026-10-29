// Traduccions. Els textos de la interfície es marquen a l'HTML amb:
//   data-i18n="clau"                 -> textContent
//   data-i18n-attr="aria-label:clau;title:clau2" -> atributs
// Els mòduls nous poden afegir-hi els seus textos amb i18n.extend().

import ca from '../i18n/ca.js';
import es from '../i18n/es.js';

export const LANGUAGES = [
  { code: 'ca', name: 'Català' },
  { code: 'es', name: 'Castellano' },
];

export function detectLanguage() {
  const langs = navigator.languages || [navigator.language || 'ca'];
  for (const l of langs) {
    const code = String(l).slice(0, 2).toLowerCase();
    if (code === 'ca' || code === 'es') return code;
  }
  return 'ca';
}

export function createI18n(store) {
  const dicts = { ca: { ...ca }, es: { ...es } };
  const lang = () => store.get().lang;

  function t(key, params = {}) {
    const text = dicts[lang()]?.[key] ?? dicts.ca[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, p) => (p in params ? params[p] : `{${p}}`));
  }

  function apply(root = document) {
    document.documentElement.lang = lang();
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  function extend(extra) {
    for (const code of Object.keys(extra)) {
      dicts[code] = { ...(dicts[code] || {}), ...extra[code] };
    }
  }

  return { t, apply, extend, lang };
}
