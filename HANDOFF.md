# Handoff — Fibo Calc (calculadora científica PWA)

> Relleu entre equips. Llegeix-lo en començar; actualitza'l en dir «cierro» o «handoff».

Última actualització: 07-11-2026 · Equip: gargamel

## Estat actual

- **Fet i funcionant**: calculadora científica PWA completa (v1.0.0).
- Repo propi: `Fibo-Lab/fibo-calc` (**públic**), branca `main`. En local: `~/Projects/docencia/fibo-calc` (a gargamel; a Azrael encara no està clonat).
- **Publicada a GitHub Pages**: https://fibo-lab.github.io/fibo-calc/ (des de `main`, arrel). Comprovat el 07-11-2026: carrega math.js, el manifest i el service worker es registra (offline per HTTPS). Es pot instal·lar al mòbil amb «Afegeix a la pantalla d'inici».
- Abans vivia a `calculadora/` del repo `Fibo-Lab/2ESO_fraccions` (PR #2, fusionada). S'ha extret amb `git subtree split` mantenint l'historial; a `2ESO_fraccions` ara només hi queda un enllaç.
- Proves: `npm test` → 9/9 passen (Node 18.19.1 a gargamel, sense dependències).
- Provada amb Chromium (Playwright): Pixel 7, iPhone 12, 320×568, mòbil apaïsat, escriptori fosc, mode offline. A gargamel, també oberta al navegador de l'app de Claude: calcula bé; allà el service worker no es registra (limitació d'aquell navegador, no de l'app).

## Últim treball fet

- Clonat, proves passades i PR `Fibo-Lab/2ESO_fraccions#2` fusionada a `main`.
- Calculadora separada al seu propi repo `fibo-calc` (nom triat per encaixar amb `fibo-press`). README actualitzat amb les rutes noves. PR `Fibo-Lab/2ESO_fraccions#3` (treu `calculadora/`) fusionada.
- Repo fet públic i GitHub Pages activat.

## Requisits originals (tots complerts)

PWA HTML/CSS/JS sense frameworks, math.js · teclat en pantalla per a mòbil · historial · alternar exacte (fracció) / decimal · graus/radiants · offline amb service worker · interfície ca/es amb selector · llicència GPL-3.0 · README · codi en mòduls per afegir després **gràfiques** i **estadística**.

## Arquitectura (resum)

```
fibo-calc/
  index.html, manifest.webmanifest, sw.js (VERSION + llista ASSETS)
  css/app.css                 mòbil primer, mode fosc, historial lateral ≥880px
  vendor/mathjs/math.js       math.js 15.2.0 UMD (global window.math), Apache-2.0
  js/main.js                  serveis + registre de mòduls + SW + pestanyes
  js/core/engine.js           avaluació; exacte/decimal; graus/rad; compileFunction()
  js/core/format.js           fraccions, π, arrels, format de nombres (pur)
  js/core/{store,i18n,history,registry}.js
  js/i18n/{ca,es}.js
  js/ui/{history-panel,toast}.js
  js/modules/calculator/      index, keys, keypad, editor (tokens), display
  tests/                      engine.test.mjs, assets.test.mjs
```

Contracte de mòdul (`js/core/registry.js`): `{ id, titleKey, icon?, i18n?, mount(container, ctx), unmount(), onLanguageChange?(), onHistoryPick?(entry, what) }`, amb `ctx = { math, engine, store, i18n, history, toast }`. Amb ≥2 mòduls apareixen pestanyes.

## Decisions preses (no re-discutir sense motiu)

- Codi i comentaris en **català**; textos UI via `data-i18n` / `i18n.t()`.
- Motor: avalua en `number`; en paral·lel prova `config({number:'Fraction'})` (es restaura sempre). Si falla, reconeix racional (den ≤ 10000), múltiple de π (den ≤ 100) o arrel (`k√r/d`). El bundle UMD **no** exporta `all`, per això no es fa `math.create(all, …)`.
- Trigonometria via **scope** (no s'ha sobreescrit math.js): graus/rad, soroll < 1e-14 → 0, `tan(90°)` → error.
- `log` = log10, `ln` = neperià, `log(x; b)` amb base. Coma `,` decimal, `;` separador d'arguments (internament `.` i `,`).
- Editor per **tokens** (esborrar treu `sin(` sencer). Parèntesis que falten es tanquen sols (fantasma gris).
- Historial desa expressions autònomes (`Ans` substituït pel valor) i parèntesis tancats.
- Llicència GPL-3.0-or-later per a tot el repo.
- Cal servidor HTTP (mòduls ES + SW): `python3 -m http.server 8080`.
- No s'ha canviat el nom intern de la memòria cau (`calculadora-${VERSION}` a `sw.js`) ni el `name` de `package.json`: no cal i evita efectes secundaris.

## Pendent / següent pas

1. **Luis:** instal·lar-la al mòbil des de https://fibo-lab.github.io/fibo-calc/ i provar-la a classe.
2. Mòdul **gràfiques**: `js/modules/graphs/`, usar `engine.compileFunction(expr)` (recompilar si canvia `store.get().angle`). Canvas sense dependències o una llibreria a `vendor/`.
3. Mòdul **estadística**: `js/modules/stats/`, usar `ctx.math` (mean, median, std, mode, quantileSeq…).
4. Per a cada mòdul nou: registrar-lo a `js/main.js` (línies comentades), afegir fitxers a `ASSETS` de `sw.js`, pujar `VERSION`. `npm test` avisa si falta algun fitxer. Cada push a `main` es publica sol a Pages.
5. Opcional: posar l'enllaç de Pages al `README.md`.

## Dubtes oberts

- `~/Projects/docencia/fraccions/` (gargamel) conté còpies antigues sense git (`Fraccions`, `fraccions_gemini`, `fraccions hermes`) i un clon vell de `2ESO_fraccions`: revisar si es poden arxivar.

## Coses a vigilar

- Canviar qualsevol fitxer → incrementar `VERSION` a `sw.js` (si no, els usuaris no reben l'actualització).
- `vendor/mathjs/package.json` (`type: commonjs`) existeix només perquè les proves de Node puguin carregar el UMD.
- Mòbil apaïsat té un layout propi (pantalla i teclat costat a costat) a `@media (max-height: 520px) and (orientation: landscape)`.
