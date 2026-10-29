// Motor de càlcul sobre math.js.
//
// - Avalua sempre en coma flotant (resultat decimal).
// - En paral·lel prova d'avaluar amb fraccions exactes de math.js; si no és
//   possible (funcions irracionals, factorials...), intenta reconèixer el
//   resultat com a fracció, múltiple de π o arrel quadrada.
// - Les funcions trigonomètriques respecten el mode graus/radiants.
// - log(x) és el logaritme decimal (com a les calculadores escolars) i ln(x) el neperià.
//
// El motor és independent de la interfície: el mòdul de gràfiques pot fer servir
// compileFunction() i el d'estadística pot accedir directament a engine.math.

import { exactFromFraction, exactFromNumber, decimalParts } from './format.js';

export class CalcError extends Error {
  constructor(key, params = {}) {
    super(key);
    this.key = key;
    this.params = params;
  }
}

export function missingParens(expr) {
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth++;
    else if (ch === ')' && depth > 0) depth--;
  }
  return depth;
}

export function balance(expr) {
  return expr + ')'.repeat(missingParens(expr));
}

export function classifyError(e) {
  if (e instanceof CalcError) return { key: e.key, params: e.params };
  const msg = String(e && e.message);
  let m;
  if ((m = msg.match(/Undefined (?:symbol|function) (\w+)/))) return { key: 'error.unknown', params: { name: m[1] } };
  if (/division by zero/i.test(msg)) return { key: 'error.divZero', params: {} };
  if (/Too (?:few|many) arguments|Wrong number of arguments/i.test(msg)) return { key: 'error.args', params: {} };
  if (e instanceof SyntaxError || /Unexpected|Parenthesis|Value expected|Invalid|char \d+/.test(msg)) {
    return { key: 'error.syntax', params: {} };
  }
  return { key: 'error.math', params: {} };
}

export function createEngine(math, getSettings) {
  let ans = { dec: 0, frac: math.fraction(0) };

  const isReal = (x) => typeof x === 'number' || math.isFraction(x) || math.isBigNumber(x);
  const isCollection = (x) => Array.isArray(x) || math.isMatrix(x);
  const num = (x) => (math.isFraction(x) || math.isBigNumber(x) ? math.number(x) : x);
  // Elimina el soroll de coma flotant típic de la trigonometria (sin(π) = 1.2e-16).
  const tidy = (r) => (typeof r === 'number' && Number.isFinite(r) ? (Math.abs(r) < 1e-14 ? 0 : Number(r.toPrecision(15))) : r);

  function buildScope(fractionMode) {
    const deg = getSettings().angle === 'deg';
    const toRad = (v) => (deg ? ((v % 360) * Math.PI) / 180 : v);
    const fromRad = (r) => (deg && typeof r === 'number' ? (r * 180) / Math.PI : r);

    const direct = (name) => function trig(x) {
      if (isCollection(x)) return math.map(x, (v) => trig(v));
      if (!isReal(x)) return math[name](x); // unitats (sin(30 deg)), complexos...
      const v = num(x);
      if (deg && (name === 'tan' || name === 'sec') && Math.abs((((v % 180) + 180) % 180) - 90) < 1e-12) {
        throw new CalcError('error.undefined');
      }
      return tidy(math[name](toRad(v)));
    };
    const inverse = (name) => function itrig(x) {
      if (isCollection(x)) return math.map(x, (v) => itrig(v));
      if (!isReal(x)) return math[name](x);
      return tidy(fromRad(math[name](num(x))));
    };
    const log = (x, base) => {
      if (base !== undefined) return math.log(isReal(x) ? num(x) : x, isReal(base) ? num(base) : base);
      return math.log10(isReal(x) ? num(x) : x);
    };
    const ln = (x) => math.log(isReal(x) ? num(x) : x);

    const scope = { log, ln, Ans: fractionMode && ans.frac !== null ? ans.frac : ans.dec };
    for (const n of ['sin', 'cos', 'tan', 'sec', 'csc', 'cot']) scope[n] = direct(n);
    for (const n of ['asin', 'acos', 'atan', 'asec', 'acsc', 'acot']) scope[n] = inverse(n);
    return scope;
  }

  function evaluateFraction(src) {
    math.config({ number: 'Fraction' });
    try {
      return math.evaluate(src, buildScope(true));
    } catch (e) {
      return e instanceof Error ? e : new Error(String(e));
    } finally {
      math.config({ number: 'number' });
    }
  }

  // Retorna { ok:true, ... } o { ok:false, error:{key, params} }. Amb una expressió buida: { empty:true }.
  function evaluate(expr, { sep = ',' } = {}) {
    if (!expr.trim()) return { empty: true };
    const src = balance(expr);
    let value;
    try {
      value = math.evaluate(src, buildScope(false));
    } catch (e) {
      return { ok: false, error: classifyError(e) };
    }
    if (value === undefined || typeof value === 'function') {
      return { ok: false, error: { key: 'error.syntax', params: {} } };
    }

    const frac = evaluateFraction(src);

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        const divZero = frac instanceof Error && /division by zero/i.test(frac.message);
        return { ok: false, error: { key: divZero ? 'error.divZero' : 'error.undefined', params: {} } };
      }
      let exact = null;
      let fraction = null;
      if (math.isFraction(frac) && Math.abs(math.number(frac) - value) <= 1e-9 * Math.max(1, Math.abs(value))) {
        exact = exactFromFraction(frac);
        fraction = frac;
      } else {
        exact = exactFromNumber(value);
        if (exact && exact.kind === 'rational') fraction = math.fraction(exact.sign * exact.n, exact.d);
      }
      return { ok: true, type: 'number', value, fraction, exact, decimal: decimalParts(math, value, sep) };
    }

    // Complexos, matrius, unitats, booleans...: es mostren com a text.
    let text = math.format(value, { precision: 12 });
    if (math.isComplex(value)) text = text.replace(/\./g, sep);
    return { ok: true, type: 'other', value, fraction: null, exact: null, decimal: null, text };
  }

  function commit(result) {
    if (!result || !result.ok) return;
    ans = { dec: result.value, frac: result.fraction };
  }

  // Per al futur mòdul de gràfiques: compila "x^2 + sin(x)" a una funció f(x) -> número.
  // El mode d'angle queda fixat en compilar; cal recompilar si canvia.
  function compileFunction(expr, variable = 'x') {
    const code = math.compile(balance(expr));
    const scope = buildScope(false);
    return (v) => {
      scope[variable] = v;
      const r = code.evaluate(scope);
      return typeof r === 'number' ? r : Number(num(r));
    };
  }

  return { math, evaluate, commit, compileFunction, getAns: () => ans.dec };
}
