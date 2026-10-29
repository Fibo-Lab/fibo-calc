// Definició del teclat en pantalla i de com es mostra cada token de l'expressió.
//
// Cada tecla pot tenir:
//   insert: token que s'afegeix a l'expressió (sintaxi de math.js)
//   action: acció especial (shift, del, clear, equals, toggle)
//   label / labelKey: text visible (literal o clau de traducció)
//   aria: clau de traducció per al nom accessible (opcional)
//   shift: { label, insert | action } segona funció
//   cls: classes CSS addicionals

export const SCI_KEYS = [
  { id: 'shift', labelKey: 'mode.shift', action: 'shift', aria: 'key.shift', cls: 'k-shift' },
  { id: 'sin', label: 'sin', insert: 'sin(', shift: { label: 'sin⁻¹', insert: 'asin(' } },
  { id: 'cos', label: 'cos', insert: 'cos(', shift: { label: 'cos⁻¹', insert: 'acos(' } },
  { id: 'tan', label: 'tan', insert: 'tan(', shift: { label: 'tan⁻¹', insert: 'atan(' } },
  { id: 'pi', label: 'π', insert: 'pi', shift: { label: 'e', insert: 'e' } },

  { id: 'sq', label: 'x²', insert: '^2', shift: { label: 'x³', insert: '^3' } },
  { id: 'sqrt', label: '√', insert: 'sqrt(', shift: { label: '∛', insert: 'cbrt(' } },
  { id: 'pow', label: 'xʸ', insert: '^', shift: { label: 'x⁻¹', insert: '^(-1)' } },
  { id: 'log', label: 'log', insert: 'log(', shift: { label: '10ˣ', insert: '10^(' } },
  { id: 'ln', label: 'ln', insert: 'ln(', shift: { label: 'eˣ', insert: 'e^(' } },

  { id: 'lp', label: '(', insert: '(', shift: { label: '|x|', insert: 'abs(' } },
  { id: 'rp', label: ')', insert: ')', shift: { label: ';', insert: ',' } },
  { id: 'fact', label: 'n!', insert: '!', shift: { label: 'nCr', insert: 'combinations(' } },
  { id: 'pct', label: '%', insert: '%', shift: { label: 'mod', insert: ' mod ' } },
  { id: 'toggle', label: 'S⇔D', action: 'toggle', aria: 'key.toggle', cls: 'k-toggle' },
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
  { id: 'div', label: '÷', insert: '/', cls: 'k-op' },

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

// Com es mostra cada token a la pantalla.
const PRETTY = {
  '*': '×', '/': '÷', '-': '−', '.': ',', ',': ';',
  pi: 'π', 'sqrt(': '√(', 'cbrt(': '∛(',
  'asin(': 'sin⁻¹(', 'acos(': 'cos⁻¹(', 'atan(': 'tan⁻¹(',
  '^2': '²', '^3': '³', '^(-1)': '⁻¹', '*10^(': '×10^(',
  'abs(': 'abs(', 'combinations(': 'nCr(',
};

export function prettyToken(tok) {
  return PRETTY[tok] ?? tok;
}

export function prettyTokens(tokens) {
  return tokens.map(prettyToken).join('');
}

// Tokens que continuen el resultat anterior (després de "=" s'hi anteposa Ans).
const CONTINUES = new Set(['+', '-', '*', '/', '^', '!', '%', '^2', '^3', '^(-1)', ' mod ', '*10^(']);
export function continuesPrevious(tok) {
  return CONTINUES.has(tok);
}

// Converteix text (teclat físic o enganxat) a tokens d'un caràcter.
export function textToTokens(text) {
  const out = [];
  for (const ch of text.replace(/\s+/g, ' ')) {
    if (ch === ',') out.push('.');
    else if (ch === ';') out.push(',');
    else if (ch === '×') out.push('*');
    else if (ch === '÷' || ch === ':') out.push('/');
    else if (ch === '−') out.push('-');
    else if (ch === 'π') out.push('pi');
    else if (ch === '√') out.push('sqrt(');
    else out.push(ch);
  }
  return out;
}
