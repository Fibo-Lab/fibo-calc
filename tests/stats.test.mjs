import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, computeBivariate, parseNumber, parsePasted } from '../js/core/stats.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const rows = (pairs) => pairs.map(([x, n]) => ({ x, n }));

test('parseNumber: coma i punt decimal', () => {
  assert.equal(parseNumber('3,5'), 3.5);
  assert.equal(parseNumber(' 3.5 '), 3.5);
  assert.equal(parseNumber('-2,25'), -2.25);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('1,2,3'), null);
});

test('conjunt clàssic 2,4,4,4,5,5,7,9', () => {
  const s = computeStats(rows([[2, 1], [4, 3], [5, 2], [7, 1], [9, 1]]));
  assert.equal(s.N, 8);
  assert.equal(s.sum, 40);
  assert.equal(s.mean, 5);
  assert.equal(s.varPop, 4);
  assert.equal(s.sdPop, 2);
  close(s.varSample, 32 / 7);
  close(s.sdSample, Math.sqrt(32 / 7));
  assert.deepEqual(s.modes, [4]);
  assert.equal(s.median, 4.5);
  assert.equal(s.q1, 4); // p=2 -> (4+4)/2
  assert.equal(s.q3, 6); // p=6 -> (5+7)/2
  assert.equal(s.iqr, 2);
  assert.equal(s.min, 2);
  assert.equal(s.max, 9);
  assert.equal(s.range, 7);
});

test('quartils amb N senar (1..5)', () => {
  const s = computeStats(rows([[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]));
  assert.equal(s.q1, 2);
  assert.equal(s.median, 3);
  assert.equal(s.q3, 4);
});

test('quartils amb N parell (1..6)', () => {
  const s = computeStats(rows([[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]]));
  assert.equal(s.q1, 2);
  assert.equal(s.median, 3.5);
  assert.equal(s.q3, 5);
});

test('quartils amb N múltiple de 4 (1..8)', () => {
  const s = computeStats(rows([[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1]]));
  assert.equal(s.q1, 2.5);
  assert.equal(s.median, 4.5);
  assert.equal(s.q3, 6.5);
});

test('modes múltiples i sense moda', () => {
  assert.deepEqual(computeStats(rows([[1, 3], [2, 1], [3, 3]])).modes, [1, 3]);
  assert.deepEqual(computeStats(rows([[1, 2], [2, 2], [3, 2]])).modes, []);
  assert.deepEqual(computeStats(rows([[7, 4]])).modes, [7]);
});

test('taula de freqüències ordenada, f, N i F', () => {
  const s = computeStats(rows([[3, 2], [1, 1], [2, 1]]));
  assert.deepEqual(s.table.map((r) => r.x), [1, 2, 3]);
  assert.deepEqual(s.table.map((r) => r.n), [1, 1, 2]);
  assert.deepEqual(s.table.map((r) => r.N), [1, 2, 4]);
  assert.deepEqual(s.table.map((r) => r.f), [0.25, 0.25, 0.5]);
  assert.deepEqual(s.table.map((r) => r.F), [0.25, 0.5, 1]);
});

test('agrupa x repetides i ignora files buides o no numèriques', () => {
  const s = computeStats([
    { x: '2', n: '1' }, { x: '2', n: 2 }, { x: '', n: '' }, { x: 'a', n: 3 },
    { x: 5, n: '' }, { x: 4, n: 1.5 }, { x: '3,5', n: '2' }, { x: 9, n: 0 },
  ]);
  assert.deepEqual(s.table.map((r) => [r.x, r.n]), [[2, 3], [3.5, 2]]);
  assert.equal(s.N, 5);
  assert.equal(s.max, 3.5);
});

test('dades buides', () => {
  const s = computeStats([]);
  assert.equal(s.empty, true);
  assert.equal(s.N, 0);
  assert.deepEqual(s.table, []);
});

test('N = 1: variància mostral no definida', () => {
  const s = computeStats(rows([[4, 1]]));
  assert.equal(s.mean, 4);
  assert.equal(s.sdPop, 0);
  assert.equal(s.sdSample, null);
  assert.equal(s.median, 4);
});

test('coma decimal en les dades', () => {
  const s = computeStats([{ x: '1,5', n: '2' }, { x: '2,5', n: '2' }]);
  assert.equal(s.mean, 2);
  assert.equal(s.median, 2);
});

test('parsePasted: una columna = llista de dades', () => {
  assert.deepEqual(parsePasted('3\n5\n3\n4,5\n'), [{ x: 3, n: 2 }, { x: 5, n: 1 }, { x: 4.5, n: 1 }]);
  assert.deepEqual(parsePasted('1 2 2 3'), [{ x: 1, n: 1 }, { x: 2, n: 2 }, { x: 3, n: 1 }]);
});

test('parsePasted: dues columnes (TSV, CSV, punt i coma, espais)', () => {
  const want = [{ x: 1, n: 3 }, { x: 2.5, n: 4 }];
  assert.deepEqual(parsePasted('1\t3\n2,5\t4'), want);
  assert.deepEqual(parsePasted('1;3\r\n2,5;4'), want);
  assert.deepEqual(parsePasted('1, 3\n2.5, 4'), want);
  assert.deepEqual(parsePasted('1 3\n2.5 4'), want);
});

test('parsePasted: salta capçaleres i ignora text buit', () => {
  assert.deepEqual(parsePasted('x\tn\n1\t2\n2\t1'), [{ x: 1, n: 2 }, { x: 2, n: 1 }]);
  assert.deepEqual(parsePasted(''), []);
  assert.deepEqual(parsePasted('hola'), []);
});

test('bivariada: recta exacta y = 1 + 2x', () => {
  const b = computeBivariate([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 9 }]);
  assert.equal(b.n, 4);
  assert.equal(b.meanX, 2.5);
  assert.equal(b.meanY, 6);
  close(b.cov, 2.5);
  close(b.b, 2);
  close(b.a, 1);
  close(b.r, 1);
});

test('bivariada: correlació negativa i coma decimal', () => {
  const b = computeBivariate([{ x: '1', y: '4,5' }, { x: '2', y: '3' }, { x: '3', y: '1,5' }, { x: 'a', y: 1 }]);
  assert.equal(b.n, 3);
  close(b.r, -1);
  close(b.b, -1.5);
  close(b.a, 6);
});

test('bivariada: dades amb dispersió (r conegut)', () => {
  // x=1..5, y=2,4,5,4,5 -> b=0.6, a=2.2, r=sqrt(0.6)*... = 0.7746
  const b = computeBivariate([[1, 2], [2, 4], [3, 5], [4, 4], [5, 5]].map(([x, y]) => ({ x, y })));
  close(b.b, 0.6);
  close(b.a, 2.2);
  close(b.r, 0.7745966692414834, 1e-12);
  close(b.r2, 0.6);
});

test('bivariada: casos degenerats', () => {
  assert.equal(computeBivariate([]).empty, true);
  const c = computeBivariate([{ x: 2, y: 1 }, { x: 2, y: 3 }]);
  assert.equal(c.r, null);
  assert.equal(c.b, null);
});
