// Proves de la notació natural (natural.js): node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layout, linearText, prettyText } from '../js/modules/calculator/natural.js';

// Converteix "2+3/4" en tokens d'un caràcter; els tokens llargs es passen a part.
const LONG = new Set(['pi', 'Ans', ' mod ', '^2', '^3', '^(-1)', '*10^(', '10^(', 'e^(']);
const T = (...parts) => parts.flatMap((p) => (LONG.has(p) || (p.length > 1 && p.endsWith('(') && /^[a-z]/i.test(p)) ? [p] : [...p]));

// Índexs de token que apareixen a l'arbre (camps i, open, close).
function indices(node, out = []) {
  if (Array.isArray(node)) { node.forEach((n) => indices(n, out)); return out; }
  if (!node || typeof node !== 'object') return out;
  for (const key of ['i', 'open', 'close']) {
    if (typeof node[key] === 'number') out.push(node[key]);
  }
  for (const [key, v] of Object.entries(node)) {
    if (v && typeof v === 'object') indices(v, out);
  }
  return out;
}

function assertAllOnce(tokens) {
  const got = indices(layout(tokens)).sort((a, b) => a - b);
  assert.deepEqual(got, tokens.map((_, k) => k), `tokens ${JSON.stringify(tokens)}`);
}

// Text pla d'un subarbre (per comparar de forma llegible).
function flat(node) {
  if (!node) return '';
  switch (node.type) {
    case 'seq': return node.children.map(flat).join('');
    case 'tok': return node.text;
    case 'placeholder': return '□';
    case 'frac': return `[${flat(node.num)}/${flat(node.den)}]`;
    case 'sup': return `${flat(node.base)}^{${flat(node.exp)}}`;
    case 'pow': return `${node.base}^{${flat(node.exp)}}`;
    case 'root': return `√${node.index ?? ''}{${flat(node.body)}}`;
    case 'abs': return `|${flat(node.body)}|`;
    case 'fn': return `${node.name}(${flat(node.body)}${node.close === null ? '‹)›' : ')'})`;
    case 'group': return node.hidden ? `{${flat(node.body)}}` : `(${flat(node.body)}${node.close === null ? '‹)›' : ')'}`;
    default: throw new Error(node.type);
  }
}
const show = (...parts) => flat(layout(T(...parts)));
const top = (tokens) => layout(tokens).children;

test('fracció simple', () => {
  const tree = top(T('3/4'));
  assert.equal(tree.length, 1);
  assert.equal(tree[0].type, 'frac');
  assert.equal(tree[0].i, 1);
  assert.equal(flat(tree[0].num), '3');
  assert.equal(flat(tree[0].den), '4');
  assert.equal(show('12/345'), '[12/345]');
});

test('precedència: només l\'operand anterior és numerador', () => {
  assert.equal(show('2+3/4'), '2+[3/4]');
  assert.equal(show('-3/4'), '−[3/4]');
  assert.equal(show('2', '^', '3/4'), '[2^{3}/4]');
  assert.equal(show('3/4', '^', '2'), '[3/4^{2}]');
  assert.equal(show('1/2/3'), '[[1/2]/3]');
  assert.equal(show('3/-4'), '[3/−4]');
  // a÷b/c = (a÷b)/c: el numerador inclou la divisió lineal.
  assert.equal(show('8', '÷', '2/4'), '[8÷2/4]');
});

test('parèntesis ocults en numerador, denominador i exponent', () => {
  const tree = top(T('(1+2)/3'));
  assert.equal(tree[0].type, 'frac');
  const g = tree[0].num.children[0];
  assert.equal(g.type, 'group');
  assert.equal(g.hidden, true);
  assert.equal(g.open, 0);
  assert.equal(g.close, 4);
  assert.equal(show('(1+2)/3'), '[{1+2}/3]');

  const d = top(T('3/(1+2)+1'));
  assert.equal(flat(d[0]), '[3/{1+2}]');
  assert.equal(d[0].close, 6, 'el ) del denominador va fora de la caixa');
  assert.equal(d[0].den.children[0].close, null);

  assert.equal(show('2', '^', '(1/2)'), '2^{{[1/2]}}');
  // Un grup amb postfix no s'amaga.
  assert.equal(show('3/(4)!'), '[3/(4)!]');
});

test('arrels, valor absolut i potències de 10', () => {
  assert.equal(show('sqrt(', '2'), '√{2}');
  const r = top(T('sqrt(', '2'))[0];
  assert.equal(r.type, 'root');
  assert.equal(r.close, null);
  assert.equal(show('sqrt(', '2)+1'), '√{2}+1');
  assert.equal(show('cbrt(', '8)'), '√3{8}');
  assert.equal(show('sqrt(', ')'), '√{□}');
  assert.equal(show('abs(', '-2)'), '|−2|');
  assert.equal(show('2', '*10^(', '3)'), '2×10^{3}');
  assert.equal(show('2', '*10^(', '3)/4'), '[2×10^{3}/4]');
  assert.equal(show('10^(', '2'), '10^{2}');
  assert.equal(show('e^(', ')'), 'e^{□}');
});

test('exponent buit i "/" sense operands → placeholder', () => {
  const s = top(T('2', '^'))[0];
  assert.equal(s.type, 'sup');
  assert.deepEqual(s.exp.children, [{ type: 'placeholder', caret: 2 }]);

  const f = top(T('/'))[0];
  assert.deepEqual(f.num.children, [{ type: 'placeholder', caret: 0 }]);
  assert.deepEqual(f.den.children, [{ type: 'placeholder', caret: 1 }]);
  assert.equal(show('/3'), '[□/3]');
  assert.equal(show('2+/'), '2+[□/□]');
  assert.equal(show('3/(', ''), '[3/{□}]');
  assert.equal(show('^', '2'), '□^{2}');
});

test('funcions amb nom bonic, separador i parèntesis fantasma', () => {
  assert.equal(show('combinations(', '5,2)'), 'nCr(5;2))');
  assert.equal(show('sin(', '30'), 'sin(30‹)›)');
  assert.equal(show('asin(', '1)'), 'sin⁻¹(1))');
  assert.equal(show('(1+2'), '(1+2‹)›');
  assert.equal(show('2', '^2'), '2²');
  assert.equal(show('2.5', ' mod ', '2'), '2,5mod2');
  assert.equal(show('x+y'), 'x+y');
  // ')' sobrer a nivell superior: es mostra tal qual.
  assert.equal(show('2)+1'), '2)+1');
});

test('cada token apareix exactament una vegada a l\'arbre', () => {
  const cases = [
    T('3/4'), T('2+3/4'), T('(1+2)/3'), T('3/(1+2)+1'), T('2', '^', '3/4'),
    T('sqrt(', '2'), T('sqrt(', '(1+2)/3)+1'), T('2', '^'), T('/'), T('2+/'),
    T('combinations(', '5,2)'), T('2', '*10^(', '3)'), T('2', '*10^(', '3)/4'),
    T('abs(', '-2', ')', '^2'), T('10^(', '2'), T('3/(', ''), T('2)+1'),
    T('2', '^', '(1/2)', '+1'), T('8', '÷', '2/4'), T('((1/2)/(3/4))', '^', '2'),
    T('cbrt(', 'pi', '^(-1)', '!'), T('Ans', '/', '2', '%'), T('^', '^', '/', '/'),
    T('sin(', 'cos(', '1/', '(2'), [],
  ];
  for (const c of cases) assertAllOnce(c);
});

test('text lineal i prettyText', () => {
  assert.equal(prettyText('*'), '×');
  assert.equal(prettyText('asin('), 'sin⁻¹(');
  assert.equal(linearText(T('sqrt(', '2+', 'sin(', '30')), '√(2+sin(30))');
  assert.equal(linearText(T('3/4')), '3/4');
});
