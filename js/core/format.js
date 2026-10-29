// Funcions pures per reconèixer valors exactes (fraccions, múltiples de π,
// arrels) i per donar format als nombres. No depenen del DOM ni de math.js,
// així es poden reutilitzar des dels mòduls de gràfiques i estadística.

export const MINUS = '−';

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

// Millor aproximació racional per fraccions contínues amb denominador <= maxDen.
// Retorna { sign, n, d } (n i d enters positius) o null si no n'hi ha cap prou precisa.
export function rationalize(x, maxDen = 10000, tol = 1e-12) {
  if (!Number.isFinite(x)) return null;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const eps = tol * Math.max(1, ax);
  if (Math.abs(ax - Math.round(ax)) <= eps) {
    return Number.isSafeInteger(Math.round(ax)) ? { sign, n: Math.round(ax), d: 1 } : null;
  }
  let h0 = 0, h1 = 1, k0 = 1, k1 = 0, b = ax;
  for (let i = 0; i < 64; i++) {
    const a = Math.floor(b);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDen || !Number.isSafeInteger(h2)) break;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    if (Math.abs(ax - h1 / k1) <= eps) return { sign, n: h1, d: k1 };
    const rest = b - a;
    if (rest < 1e-15) break;
    b = 1 / rest;
  }
  return null;
}

// Extreu els factors quadrats: sqrt(m) = k * sqrt(r)
function simplifySqrt(m) {
  let k = 1, r = m;
  for (let f = 2; f * f <= r; f++) {
    while (r % (f * f) === 0) { r /= f * f; k *= f; }
  }
  return { k, r };
}

// Intenta expressar un nombre de coma flotant en forma exacta.
// Tipus retornats:
//   { kind: 'rational', sign, n, d }   -> n/d
//   { kind: 'pi',       sign, n, d }   -> nπ/d
//   { kind: 'sqrt',     sign, k, r, d } -> k√r/d
export function exactFromNumber(x) {
  if (!Number.isFinite(x)) return null;
  const q = rationalize(x, 10000);
  if (q) return { kind: 'rational', ...q };
  const p = rationalize(x / Math.PI, 100);
  if (p && p.n !== 0 && p.n <= 1000) return { kind: 'pi', ...p };
  const s = rationalize(x * x, 1000);
  if (s && s.n * s.d <= 1e6) {
    const { k, r } = simplifySqrt(s.n * s.d);
    if (r > 1) {
      const g = gcd(k, s.d);
      return { kind: 'sqrt', sign: x < 0 ? -1 : 1, k: k / g, r, d: s.d / g };
    }
  }
  return null;
}

// Converteix un objecte Fraction de math.js (s, n, d com a BigInt o Number) al format intern.
export function exactFromFraction(f) {
  const sign = Number(f.s) < 0 ? -1 : 1;
  return { kind: 'rational', sign, n: String(f.n), d: String(f.d) };
}

// Parts per dibuixar un valor exacte: { sign, top, bottom } on top/bottom són text.
export function exactParts(ex) {
  const d = String(ex.d);
  const sign = ex.sign < 0 && String(ex.n ?? ex.k) !== '0' ? MINUS : '';
  let top;
  if (ex.kind === 'pi') top = (String(ex.n) === '1' ? '' : String(ex.n)) + 'π';
  else if (ex.kind === 'sqrt') top = (ex.k === 1 ? '' : String(ex.k)) + '√' + ex.r;
  else top = String(ex.n);
  return { sign, top, bottom: d === '1' ? null : d };
}

export function exactToText(ex) {
  const { sign, top, bottom } = exactParts(ex);
  return sign + top + (bottom ? '/' + bottom : '');
}

export function isInteger(ex) {
  return ex && ex.kind === 'rational' && String(ex.d) === '1';
}

// Format decimal: retorna { mantissa, exp } amb el separador decimal indicat.
export function decimalParts(math, x, sep = ',') {
  const s = math.format(x, { precision: 12, lowerExp: -9, upperExp: 12 });
  const [m, e] = s.split('e');
  return {
    mantissa: m.replace('.', sep).replace('-', MINUS),
    exp: e ? String(Number(e)).replace('-', MINUS) : null,
  };
}

export function decimalToText(parts) {
  return parts.mantissa + (parts.exp ? '·10^' + parts.exp : '');
}
