// Proves del sistema de temes: herència, completesa i contrast mínim.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, PICKER_ORDER } from '../js/themes/presets.js';
import { resolveTheme, contrastReport, sanitizeTheme, contrast } from '../js/themes/resolve.js';

const baseKeys = Object.keys(resolveTheme('base', PRESETS).vars).sort();

test('tots els temes resolen amb tots els tokens de base', () => {
  for (const id of Object.keys(PRESETS)) {
    const t = resolveTheme(id, PRESETS);
    assert.deepEqual(Object.keys(t.vars).sort(), baseKeys, id);
  }
});

test('auto tria clar o fosc segons el sistema', () => {
  assert.equal(resolveTheme('auto', PRESETS, { prefersDark: false }).id, 'light');
  assert.equal(resolveTheme('auto', PRESETS, { prefersDark: true }).id, 'dark');
  assert.equal(resolveTheme('auto', PRESETS, { prefersDark: true }).scheme, 'dark');
});

test('herència: cyberpunk estén dark i en redefineix una part', () => {
  const t = resolveTheme('cyberpunk', PRESETS);
  assert.equal(t.scheme, 'dark');
  assert.equal(t.vars['--accent'], '#00F0FF');
  assert.equal(t.vars['--chip-radius'], '3px');
  assert.deepEqual(t.fx, ['glow', 'scanlines']);
  assert.deepEqual(resolveTheme('dark', PRESETS).fx, []);
});

test('un id desconegut torna el tema clar', () => {
  assert.equal(resolveTheme('no-existeix', PRESETS).id, 'light');
});

test('un cicle d’extends no penja', () => {
  const themes = { ...PRESETS, a: { id: 'a', extends: 'b', tokens: {} }, b: { id: 'b', extends: 'a', tokens: {} } };
  assert.equal(resolveTheme('a', themes).id, 'a');
});

test('contrast mínim WCAG en tots els temes del selector', () => {
  for (const id of PICKER_ORDER.filter((x) => x !== 'auto')) {
    for (const r of contrastReport(resolveTheme(id, PRESETS))) {
      assert.ok(r.ok, `${id}: ${r.fg} sobre ${r.bg} = ${r.ratio?.toFixed(2)} (mínim ${r.min})`);
    }
  }
  assert.equal(contrast('#000', '#fff').toFixed(0), '21');
});

test('sanitizeTheme descarta claus desconegudes i valors perillosos', () => {
  const { theme, errors } = sanitizeTheme({
    id: 'meu tema!', extends: 'dark',
    tokens: { color: { accent: '#f80', hack: 'red', bg: 'red;}body{display:none' } },
  }, PRESETS.base);
  assert.equal(theme.id, 'meutema');
  assert.deepEqual(theme.tokens, { color: { accent: '#f80' } });
  assert.deepEqual(errors.sort(), ['color.bg', 'color.hack']);
});
