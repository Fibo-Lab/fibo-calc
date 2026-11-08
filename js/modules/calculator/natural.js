// Notació natural: converteix la llista de tokens de l'editor en un arbre de caixes
// (fraccions apilades, arrels, exponents, |x|…) sense canviar el model de tokens.
// Mòdul PUR (sense DOM): el dibuix es fa a natural-render.js.
//
// Nodes de l'arbre (cada node que correspon a un token porta el seu índex):
//   seq{children}
//   tok{i, text, kind}             kind: num | const | op | sep | postfix | paren | text
//   frac{i, num, den, close}       i = índex del '/'; close = ')' amagat del denominador (o null)
//   sup{i, base, exp, close}       i = índex del '^'; close = ')' amagat de l'exponent (o null)
//   pow{i, base, exp, close}       '10^(' 'e^(' '*10^(': base de text + exponent fins al ')'
//   root{i, index, body, close}    'sqrt(' (index null) i 'cbrt(' (index '3')
//   abs{i, body, close}            'abs(' → |…|
//   fn{i, name, body, close}       altres funcions: nom + parèntesis visibles
//   group{open, close, body, hidden}  '(…)'; close null = falta (fantasma si és visible)
//   placeholder{caret}             forat buit; caret = posició on s'escriuria
//
// Semàntica del cursor: el caret k es dibuixa just després de l'element del token k-1.
// Per això els tokens que obren una caixa tenen l'element (d'amplada zero) a l'inici
// de la caixa, i els ')' amagats de denominadors/exponents/arrels van just després.

const POSTFIX = new Set(['!', '%', '^2', '^3', '^(-1)']);
const BINARY = new Set(['+', '-', '*', '÷', ' mod ']);
const CONSTS = new Set(['pi', 'e', 'Ans']);
// Operadors de la mateixa precedència que '/' que no són associatius: a÷b/c = (a÷b)/c.
const LINEAR_DIV = new Set(['÷', ' mod ']);

const PRETTY = {
  '*': '×', '÷': '÷', '/': '/', '-': '−', '.': ',', ',': ';', pi: 'π',
  '^2': '²', '^3': '³', '^(-1)': '⁻¹', ' mod ': 'mod',
  'sqrt(': '√(', 'cbrt(': '∛(', '*10^(': '×10^(',
};

const FN_NAMES = {
  'asin(': 'sin⁻¹', 'acos(': 'cos⁻¹', 'atan(': 'tan⁻¹',
  'asinh(': 'sinh⁻¹', 'acosh(': 'cosh⁻¹', 'atanh(': 'tanh⁻¹',
  'combinations(': 'nCr', 'permutations(': 'nPr',
};

// Text visible d'un token (en notació lineal).
export function prettyText(tok) {
  if (tok in PRETTY) return PRETTY[tok];
  if (tok in FN_NAMES) return FN_NAMES[tok] + '(';
  return tok;
}

// Nom bonic d'una funció ('sin(' → 'sin').
export function fnName(tok) {
  return FN_NAMES[tok] ?? tok.slice(0, -1);
}

// Expressió en text pla (per a l'aria-label), amb els parèntesis que falten.
export function linearText(tokens) {
  let depth = 0;
  for (const t of tokens) {
    if (t.endsWith('(')) depth++;
    else if (t === ')' && depth > 0) depth--;
  }
  return tokens.map(prettyText).join('') + ')'.repeat(depth);
}

const isDigit = (t) => /^[0-9]$/.test(t) || t === '.';
const isLetter = (t) => /^[A-Za-z_]$/.test(t) && !CONSTS.has(t);
const isFnOpen = (t) => t.length > 1 && t.endsWith('(') && t !== '*10^(';

function kindOf(t) {
  if (isDigit(t)) return 'num';
  if (CONSTS.has(t)) return 'const';
  if (BINARY.has(t)) return 'op';
  if (t === ',') return 'sep';
  if (POSTFIX.has(t)) return 'postfix';
  if (t === '(' || t === ')') return 'paren';
  return 'text';
}

const seq = (children) => ({ type: 'seq', children });
const ph = (caret) => ({ type: 'placeholder', caret });
const asSeq = (node) => (node.type === 'seq' ? node : seq([node]));

export function layout(tokens) {
  const P = { t: tokens, p: 0 };
  return seq(parseSeq(P, true));
}

function tokNode(P) {
  const i = P.p++;
  const t = P.t[i];
  return { type: 'tok', i, text: prettyText(t), kind: kindOf(t) };
}

// Seqüència fins a ')' (que no es consumeix) o fins al final.
// A nivell superior, un ')' sobrer es mostra tal qual.
function parseSeq(P, top) {
  const out = [];
  const operand = []; // out[k] és un operand?
  const push = (node, isOp) => { out.push(node); operand.push(isOp); };
  const last = () => operand.length > 0 && operand[operand.length - 1];

  while (P.p < P.t.length) {
    const t = P.t[P.p];
    if (t === ')') {
      if (!top) break;
      push(tokNode(P), false);
      continue;
    }
    if (t === '/') {
      const i = P.p++;
      let num;
      if (last()) {
        // Numerador = operand anterior (i, si va precedit de ÷ o mod, tota la cadena).
        let start = out.length - 1;
        while (start >= 2 && operand[start - 2] && isLinearDiv(P, out[start - 1])) start -= 2;
        const kids = out.splice(start);
        operand.splice(start);
        num = kids.length === 1 ? numSlot(kids[0]) : seq(kids);
      } else {
        num = seq([ph(i)]);
      }
      const { box, close } = parseSlot(P);
      push(extend(P, { type: 'frac', i, num, den: box, close }), true);
      continue;
    }
    if (t === '^' || t === '*10^(' || POSTFIX.has(t)) {
      if (last()) {
        operand.pop();
        push(extend(P, out.pop()), true);
      } else if (t === '^') {
        push(extend(P, seq([ph(P.p)])), true);
      } else if (t === '*10^(') {
        push(extend(P, parseBodyBox(P, 'pow')), true);
      } else {
        push(tokNode(P), false);
      }
      continue;
    }
    const atom = parseAtom(P);
    if (atom) push(extend(P, atom), true);
    else push(tokNode(P), false);
  }
  return out;
}

function isLinearDiv(P, node) {
  return node.type === 'tok' && LINEAR_DIV.has(P.t[node.i]);
}

// Afegeix a un operand els postfixos, exponents i ×10^(…) que el segueixen.
function extend(P, node) {
  for (;;) {
    const t = P.t[P.p];
    if (POSTFIX.has(t)) {
      node = seq([node, tokNode(P)]);
    } else if (t === '^') {
      const i = P.p++;
      const { box, close } = parseSlot(P);
      node = { type: 'sup', i, base: node, exp: box, close };
    } else if (t === '*10^(') {
      node = seq([node, parseBodyBox(P, 'pow')]);
    } else {
      return node;
    }
  }
}

// Numerador: si és un grup '(…)' sol, se n'amaguen els parèntesis (els dos queden a dins).
function numSlot(node) {
  if (node.type === 'group' && !node.hidden) hideGroup(node);
  return asSeq(node);
}

function hideGroup(g) {
  g.hidden = true;
  if (g.body.children.length === 0) g.body.children.push(ph(g.open + 1));
}

// Operand que segueix un '/' o un '^' (denominador o exponent).
// Retorna la caixa i, si l'operand era un grup '(…)', el seu ')' (que va fora de la caixa).
function parseSlot(P) {
  const kids = [];
  while (P.t[P.p] === '-' || P.t[P.p] === '+') kids.push(tokNode(P)); // signes unaris
  const atom = parseAtom(P);
  if (!atom) {
    kids.push(ph(P.p));
    return { box: seq(kids), close: null };
  }
  const unit = extend(P, atom);
  if (kids.length === 0 && unit.type === 'group') {
    hideGroup(unit);
    const close = unit.close;
    unit.close = null;
    return { box: seq([unit]), close };
  }
  kids.push(unit);
  return { box: seq(kids), close: null };
}

function parseAtom(P) {
  const t = P.t[P.p];
  if (t === undefined) return null;
  if (isDigit(t)) {
    const kids = [];
    while (P.p < P.t.length && isDigit(P.t[P.p])) kids.push(tokNode(P));
    return seq(kids);
  }
  if (CONSTS.has(t)) return tokNode(P);
  if (isLetter(t)) {
    const kids = [];
    while (P.p < P.t.length && isLetter(P.t[P.p])) kids.push(tokNode(P));
    return seq(kids);
  }
  if (t === '(') {
    const open = P.p++;
    const body = seq(parseSeq(P, false));
    const close = P.t[P.p] === ')' ? P.p++ : null;
    return { type: 'group', open, close, body, hidden: false };
  }
  if (t === 'sqrt(' || t === 'cbrt(') return parseBodyBox(P, 'root');
  if (t === 'abs(') return parseBodyBox(P, 'abs');
  if (t === '10^(' || t === 'e^(') return parseBodyBox(P, 'pow');
  if (isFnOpen(t)) return parseBodyBox(P, 'fn');
  return null;
}

// Caixes que s'obren amb un token acabat en '(' i es tanquen amb el seu ')'.
function parseBodyBox(P, type) {
  const i = P.p++;
  const t = P.t[i];
  const body = seq(parseSeq(P, false));
  const close = P.t[P.p] === ')' ? P.p++ : null;
  if (type === 'fn') return { type, i, name: fnName(t), body, close };
  if (body.children.length === 0) body.children.push(ph(i + 1));
  if (type === 'root') return { type, i, index: t === 'cbrt(' ? '3' : null, body, close };
  if (type === 'abs') return { type, i, body, close };
  const base = t === '*10^(' ? '×10' : t === 'e^(' ? 'e' : '10';
  return { type: 'pow', i, base, exp: body, close };
}
