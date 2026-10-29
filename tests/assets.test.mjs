// Comprova que el service worker precarrega tots els fitxers de l'app
// (així, en afegir un mòdul nou, no t'oblides de posar-lo a sw.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const assets = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [relative(root, p)];
  });
}

test('tots els fitxers de la llista del service worker existeixen', () => {
  for (const a of assets) assert.ok(existsSync(join(root, a)), `falta ${a}`);
});

test('tots els mòduls JS són a la llista del service worker', () => {
  for (const f of walk(join(root, 'js'))) assert.ok(assets.includes(f), `${f} no és a sw.js`);
});
