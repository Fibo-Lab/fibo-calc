// Resolució de temes (pur, sense DOM: es pot provar amb Node).
//
// resolveTheme(id, themes, { prefersDark }) aplana la cadena "extends" i retorna
// un tema complet: { id, name, scheme, tokens:{...}, fx:[...], vars:{ '--bg': '#…', ... } }.

export const MAX_DEPTH = 8;
const GROUPS = ['color', 'shape', 'depth', 'type', 'motion'];

export function resolveId(id, { prefersDark = false } = {}) {
  return id === 'auto' ? (prefersDark ? 'dark' : 'light') : id;
}

function mergeTokens(parent, child) {
  const out = {};
  for (const g of GROUPS) out[g] = { ...(parent?.[g] || {}), ...(child?.[g] || {}) };
  return out;
}

export function resolveTheme(id, themes, opts = {}) {
  const realId = resolveId(id, opts);
  const chain = [];
  let cur = themes[realId] || themes.light;
  while (cur && chain.length < MAX_DEPTH) {
    if (chain.includes(cur)) break; // cicle: ens aturem
    chain.unshift(cur);
    cur = cur.extends ? themes[cur.extends] : null;
  }
  let tokens = {};
  let scheme = 'light';
  let fx = [];
  for (const t of chain) {
    tokens = mergeTokens(tokens, t.tokens);
    if (t.scheme) scheme = t.scheme;
    if (t.fx) fx = t.fx.slice(); // els efectes no s'hereten si el fill en declara
  }
  const top = chain[chain.length - 1];
  return { id: top.id, name: top.name, scheme, tokens, fx, vars: toVars(tokens) };
}

export function toVars(tokens) {
  const vars = {};
  for (const g of GROUPS) for (const [k, v] of Object.entries(tokens[g] || {})) vars[`--${k}`] = v;
  return vars;
}

// Valida un tema d'usuari: només claus conegudes (les de base) i valors de text curts.
// Retorna { theme, errors }. Les claus desconegudes es descarten.
export function sanitizeTheme(raw, baseTheme, { isValid = () => true } = {}) {
  const errors = [];
  const theme = {
    id: String(raw?.id || '').replace(/[^\w-]/g, '').slice(0, 40),
    extends: typeof raw?.extends === 'string' ? raw.extends : 'light',
    name: raw?.name && typeof raw.name === 'object' ? raw.name : { ca: String(raw?.id || 'Tema'), es: String(raw?.id || 'Tema') },
    tokens: {},
    fx: Array.isArray(raw?.fx) ? raw.fx.filter((f) => typeof f === 'string') : undefined,
  };
  if (raw?.scheme === 'dark' || raw?.scheme === 'light') theme.scheme = raw.scheme;
  if (!theme.id) errors.push('id');
  for (const g of GROUPS) {
    const known = baseTheme.tokens[g] || {};
    for (const [k, v] of Object.entries(raw?.tokens?.[g] || {})) {
      if (!(k in known)) { errors.push(`${g}.${k}`); continue; }
      if (typeof v !== 'string' || v.length > 200 || /[;{}<>]/.test(v) || !isValid(g, k, v)) { errors.push(`${g}.${k}`); continue; }
      (theme.tokens[g] ||= {})[k] = v;
    }
  }
  return { theme, errors };
}

// --- Contrast WCAG (per comprovar temes i, en el futur, els creats per l'usuari) ---

export function parseHex(hex) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// Retorna la ràtio de contrast (1–21) o null si algun color no és hexadecimal.
export function contrast(a, b) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return null;
  const [l1, l2] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Parelles de text/fons que han de ser llegibles en qualsevol tema.
export const CONTRAST_PAIRS = [
  ['ink', 'bg', 4.5],
  ['ink', 'surface', 4.5],
  ['screen-ink', 'screen', 4.5],
  ['key-ink', 'key', 4.5],
  ['key-ink', 'key-num', 4.5],
  ['key-ink', 'key-fn', 4.5],
  ['key-ink', 'key-op', 4.5],
  ['key-ink', 'key-del', 4.5],
  ['on-eq', 'key-eq', 4.5],
  ['accent-ink', 'accent', 4.5],
  ['muted', 'surface', 3],
  ['accent', 'surface', 3],
];

export function contrastReport(resolved) {
  const c = resolved.tokens.color;
  return CONTRAST_PAIRS.map(([fg, bg, min]) => {
    const ratio = contrast(c[fg], c[bg]);
    return { fg, bg, min, ratio, ok: ratio === null || ratio >= min };
  });
}
