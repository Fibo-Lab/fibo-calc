// Proves del motor de càlcul: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createEngine, missingParens } from '../js/core/engine.js';
import { exactToText, rationalize } from '../js/core/format.js';

const math = createRequire(import.meta.url)('../vendor/mathjs/math.js');
const settings = { angle: 'deg' };
const engine = createEngine(math, () => settings);
const run = (expr) => engine.evaluate(expr);
const exact = (expr) => exactToText(run(expr).exact);
const dec = (expr) => run(expr).decimal.mantissa;

test('fraccions exactes', () => {
  assert.equal(exact('1/3+1/4'), '7/12');
  assert.equal(exact('0.1+0.2'), '3/10');
  assert.equal(exact('(2/3)^2'), '4/9');
  assert.equal(exact('1/12345+1'), '12346/12345');
  assert.equal(exact('-6/4'), '−3/2');
  assert.equal(exact('50%'), '1/2');
  assert.equal(dec('1/3'), '0,333333333333');
});

test('formes exactes de resultats irracionals', () => {
  assert.equal(exact('sqrt(8)'), '2√2');
  assert.equal(exact('sin(45)'), '√2/2');
  assert.equal(exact('sqrt(3)/6'), '√3/6');
  assert.equal(exact('2*pi/3'), '2π/3');
  assert.equal(run('e').exact, null);
});

test('graus i radiants', () => {
  settings.angle = 'deg';
  assert.equal(exact('sin(30)'), '1/2');
  assert.equal(exact('cos(90)'), '0');
  assert.equal(exact('asin(1/2)'), '30');
  assert.equal(run('tan(90)').error.key, 'error.undefined');
  settings.angle = 'rad';
  assert.equal(exact('sin(pi/6)'), '1/2');
  assert.equal(exact('acos(-1)'), 'π');
  assert.equal(exact('sin(pi)'), '0');
  settings.angle = 'deg';
});

test('funcions escolars', () => {
  assert.equal(exact('log(1000)'), '3');
  assert.equal(exact('ln(e^2)'), '2');
  assert.equal(exact('log(8,2)'), '3');
  assert.equal(exact('5!/3!'), '20');
  assert.equal(exact('cbrt(27)'), '3');
  assert.equal(exact('combinations(5,2)'), '10');
  assert.equal(exact('2*10^(3'), '2000');
});

test('Ans', () => {
  engine.commit(run('1/3'));
  assert.equal(exact('Ans*3'), '1');
  assert.equal(exact('Ans+1/6'), '1/2');
});

test('errors', () => {
  assert.equal(run('1/0').error.key, 'error.divZero');
  assert.equal(run('2+*3').error.key, 'error.syntax');
  assert.equal(run('foo+1').error.key, 'error.unknown');
  assert.equal(run('log(0)').error.key, 'error.undefined');
  assert.ok(run('   ').empty);
});

test('altres tipus i utilitats', () => {
  assert.equal(run('sqrt(-4)').text, '2i');
  assert.equal(missingParens('sin(2*(3'), 2);
  assert.deepEqual(rationalize(0.75), { sign: 1, n: 3, d: 4 });
  const f = engine.compileFunction('x^2+1');
  assert.equal(f(3), 10);
});
