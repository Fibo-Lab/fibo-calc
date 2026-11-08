// Definició del teclat en pantalla i de com es mostra cada token de l'expressió.
//
// El teclat té dues parts:
//   PAGES: pàgines de funcions que es canvien lliscant (o tocant la pestanya).
//   MAIN_KEYS: números i operacions bàsiques, SEMPRE fixos (no es mouen mai).
//
// Cada tecla pot tenir:
//   insert: token que s'afegeix a l'expressió (sintaxi de math.js, vegeu TOKEN_SRC)
//   action: acció especial (del, clear, equals, toggle, angle)
//   label / labelKey / icon: text visible (literal, clau de traducció o SVG estàtic)
//   aria: clau de traducció per al nom accessible (opcional)
//   variants: [{ label, insert }] opcions de la pulsació llarga (funcions menys freqüents)
//   cls: classes CSS addicionals

const FRAC_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="7" y="2.5" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="7" y="14.5" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

const K = {
  frac: { id: 'frac', icon: FRAC_ICON, insert: '/', aria: 'key.frac', cls: 'k-op' },
  sq: { id: 'sq', label: 'x²', insert: '^2', variants: [{ label: 'x³', insert: '^3' }, { label: 'x⁻¹', insert: '^(-1)' }] },
  pow: { id: 'pow', label: 'xʸ', insert: '^' },
  sqrt: { id: 'sqrt', label: '√', insert: 'sqrt(', variants: [{ label: '∛', insert: 'cbrt(' }, { label: 'ⁿ√', insert: 'nthRoot(' }] },
  pi: { id: 'pi', label: 'π', insert: 'pi', variants: [{ label: 'e', insert: 'e' }] },
  lp: { id: 'lp', label: '(', insert: '(' },
  rp: { id: 'rp', label: ')', insert: ')' },
  fact: { id: 'fact', label: 'n!', insert: '!', variants: [{ label: 'nCr', insert: 'combinations(' }, { label: 'nPr', insert: 'permutations(' }] },
  pct: { id: 'pct', label: '%', insert: '%', variants: [{ label: 'mod', insert: ' mod ' }] },
  toggle: { id: 'toggle', label: 'S⇔D', action: 'toggle', aria: 'key.toggle', cls: 'k-toggle' },
  log: { id: 'log', label: 'log', insert: 'log(', variants: [{ label: '10ˣ', insert: '10^(' }] },
  ln: { id: 'ln', label: 'ln', insert: 'ln(', variants: [{ label: 'eˣ', insert: 'e^(' }] },
  abs: { id: 'abs', label: '|x|', insert: 'abs(', variants: [{ label: '⌊x⌋', insert: 'floor(' }, { label: '⌈x⌉', insert: 'ceil(' }, { label: 'round', insert: 'round(' }] },
  sep: { id: 'sep', label: ';', insert: ',', aria: 'key.separator' },
  inv: { id: 'inv', label: 'x⁻¹', insert: '^(-1)' },

  sin: { id: 'sin', label: 'sin', insert: 'sin(', variants: [{ label: 'sin⁻¹', insert: 'asin(' }, { label: 'sinh', insert: 'sinh(' }] },
  cos: { id: 'cos', label: 'cos', insert: 'cos(', variants: [{ label: 'cos⁻¹', insert: 'acos(' }, { label: 'cosh', insert: 'cosh(' }] },
  tan: { id: 'tan', label: 'tan', insert: 'tan(', variants: [{ label: 'tan⁻¹', insert: 'atan(' }, { label: 'tanh', insert: 'tanh(' }] },
  angle: { id: 'angle', action: 'angle', aria: 'key.angle', cls: 'k-angle' }, // etiqueta dinàmica (GRAUS/RAD)
  asin: { id: 'asin', label: 'sin⁻¹', insert: 'asin(' },
  acos: { id: 'acos', label: 'cos⁻¹', insert: 'acos(' },
  atan: { id: 'atan', label: 'tan⁻¹', insert: 'atan(' },
  sinh: { id: 'sinh', label: 'sinh', insert: 'sinh(', variants: [{ label: 'sinh⁻¹', insert: 'asinh(' }] },
  cosh: { id: 'cosh', label: 'cosh', insert: 'cosh(', variants: [{ label: 'cosh⁻¹', insert: 'acosh(' }] },
  tanh: { id: 'tanh', label: 'tanh', insert: 'tanh(', variants: [{ label: 'tanh⁻¹', insert: 'atanh(' }] },

  cbrt: { id: 'cbrt', label: '∛', insert: 'cbrt(' },
  nroot: { id: 'nroot', label: 'ⁿ√', insert: 'nthRoot(', aria: 'key.nroot' },
  cube: { id: 'cube', label: 'x³', insert: '^3' },
  exp10: { id: 'exp10', label: '10ˣ', insert: '10^(' },
  expe: { id: 'expe', label: 'eˣ', insert: 'e^(' },
  ncr: { id: 'ncr', label: 'nCr', insert: 'combinations(' },
  npr: { id: 'npr', label: 'nPr', insert: 'permutations(' },
  mod: { id: 'mod', label: 'mod', insert: ' mod ' },
  gcd: { id: 'gcd', label: 'mcd', insert: 'gcd(', aria: 'key.gcd' },
  lcm: { id: 'lcm', label: 'mcm', insert: 'lcm(', aria: 'key.lcm' },
  floor: { id: 'floor', label: '⌊x⌋', insert: 'floor(' },
  ceil: { id: 'ceil', label: '⌈x⌉', insert: 'ceil(' },
  round: { id: 'round', label: 'round', insert: 'round(' },
  e: { id: 'e', label: 'e', insert: 'e' },
};

// 3 files × 5 columnes per pàgina (totes igual d'altes perquè el teclat no salti).
export const PAGES = [
  { id: 'basic', labelKey: 'page.basic', keys: [
    K.frac, K.sq, K.pow, K.sqrt, K.pi,
    K.lp, K.rp, K.fact, K.pct, K.toggle,
    K.log, K.ln, K.abs, K.sep, K.inv,
  ] },
  { id: 'trig', labelKey: 'page.trig', keys: [
    K.sin, K.cos, K.tan, K.pi, K.angle,
    K.asin, K.acos, K.atan, K.lp, K.rp,
    K.sinh, K.cosh, K.tanh, K.sq, K.sqrt,
  ] },
  { id: 'adv', labelKey: 'page.adv', keys: [
    K.cbrt, K.nroot, K.cube, K.exp10, K.expe,
    K.ncr, K.npr, K.mod, K.gcd, K.lcm,
    K.floor, K.ceil, K.round, K.e, K.sep,
  ] },
];

export const MAIN_KEYS = [
  { id: '7', label: '7', insert: '7', cls: 'k-num' },
  { id: '8', label: '8', insert: '8', cls: 'k-num' },
  { id: '9', label: '9', insert: '9', cls: 'k-num' },
  { id: 'del', label: '⌫', action: 'del', aria: 'key.del', cls: 'k-del' },
  { id: 'clear', label: 'AC', action: 'clear', aria: 'key.clear', cls: 'k-del' },

  { id: '4', label: '4', insert: '4', cls: 'k-num' },
  { id: '5', label: '5', insert: '5', cls: 'k-num' },
  { id: '6', label: '6', insert: '6', cls: 'k-num' },
  { id: 'mul', label: '×', insert: '*', cls: 'k-op' },
  { id: 'div', label: '÷', insert: '÷', cls: 'k-op' },

  { id: '1', label: '1', insert: '1', cls: 'k-num' },
  { id: '2', label: '2', insert: '2', cls: 'k-num' },
  { id: '3', label: '3', insert: '3', cls: 'k-num' },
  { id: 'add', label: '+', insert: '+', cls: 'k-op' },
  { id: 'sub', label: '−', insert: '-', cls: 'k-op' },

  { id: '0', label: '0', insert: '0', cls: 'k-num' },
  { id: 'dot', label: ',', insert: '.', aria: 'key.decimal', cls: 'k-num' },
  { id: 'exp', label: '×10ˣ', insert: '*10^(', aria: 'key.exp', cls: 'k-small' },
  { id: 'ans', label: 'Ans', insert: 'Ans', aria: 'key.ans', cls: 'k-small' },
  { id: 'eq', label: '=', action: 'equals', aria: 'key.equals', cls: 'k-eq' },
];

// Tokens que no són sintaxi de math.js tal qual: aquí es diu què s'avalua.
// '/' és la fracció (es dibuixa apilada); '÷' és la divisió "en línia".
export const TOKEN_SRC = { '÷': '/' };
export const tokenSrc = (tok) => TOKEN_SRC[tok] ?? tok;

// Com es mostra cada token en text pla (historial, lectors de pantalla).
const PRETTY = {
  '*': '×', '-': '−', '.': ',', ',': ';',
  pi: 'π', 'sqrt(': '√(', 'cbrt(': '∛(', 'nthRoot(': 'ⁿ√(',
  'asin(': 'sin⁻¹(', 'acos(': 'cos⁻¹(', 'atan(': 'tan⁻¹(',
  'asinh(': 'sinh⁻¹(', 'acosh(': 'cosh⁻¹(', 'atanh(': 'tanh⁻¹(',
  '^2': '²', '^3': '³', '^(-1)': '⁻¹', '*10^(': '×10^(',
  'combinations(': 'nCr(', 'permutations(': 'nPr(', 'gcd(': 'mcd(', 'lcm(': 'mcm(',
};

export function prettyToken(tok) {
  return PRETTY[tok] ?? tok;
}

export function prettyTokens(tokens) {
  return tokens.map(prettyToken).join('');
}

// Tokens que continuen el resultat anterior (després de "=" s'hi anteposa Ans).
const CONTINUES = new Set(['+', '-', '*', '/', '÷', '^', '!', '%', '^2', '^3', '^(-1)', ' mod ', '*10^(']);
export function continuesPrevious(tok) {
  return CONTINUES.has(tok);
}

// Converteix text (teclat físic o enganxat) a tokens d'un caràcter.
// "/" és fracció; ":" i "÷" són divisió en línia.
export function textToTokens(text) {
  const out = [];
  for (const ch of text.replace(/\s+/g, ' ')) {
    if (ch === ',') out.push('.');
    else if (ch === ';') out.push(',');
    else if (ch === '×') out.push('*');
    else if (ch === '÷' || ch === ':') out.push('÷');
    else if (ch === '−') out.push('-');
    else if (ch === 'π') out.push('pi');
    else if (ch === '√') out.push('sqrt(');
    else out.push(ch);
  }
  return out;
}
