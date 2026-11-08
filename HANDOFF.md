# Handoff — Fibo Calc (calculadora científica PWA)

> Relleu entre equips. Llegeix-lo en començar; actualitza'l en dir «cierro» o «handoff».

Última actualització: 08-11-2026 · Equip: gargamel

## Estat actual

- **v2.0.0** publicada a GitHub Pages: https://fibo-lab.github.io/fibo-calc/ (repo públic `Fibo-Lab/fibo-calc`, branca `main`; cada push a `main` es publica sol).
- Usuaris: alumnes i professors d'**ESO i Batxillerat**, sense distinció de rol.
- `npm test` → 42/42 (motor, temes, notació natural, estadística, llista del SW). Node 18 a gargamel.
- Provat a gargamel amb el navegador de l'app de Claude (Chromium), a 375×812, 320×568 i 812×375 apaïsat: calcula, notació natural, tocar la fórmula per moure el cursor, pulsació llarga (amb dit simulat i clic dret), canvi de pàgina amb pestanyes, 6 temes i diàleg d'ajustos, mòdul d'estadística en vertical i apaïsat.
- **Provat per Luis en un mòbil real (08-11-2026): tot el que ha provat funciona bé**, i també ho ha provat un amic. A Luis li agrada com queden les fraccions i els exponents. Falta provar-la amb el projector.
- Per provar en local: `python3 -m http.server 8080` i obrir `http://localhost:8080/?nosw` (`?nosw` evita el service worker, que si no serveix fitxers vells de la memòria cau).

## Últim treball fet (08-11-2026)

Rediseny v2 a partir d'una proposta de disseny (feta amb Gemini) revisada:
- **Temes per tokens**: `js/themes/presets.js` (dades: base, light, dark, projector, cyberpunk, zen; `extends` per heretar), `js/themes/resolve.js` (pur: resolució, contrast WCAG, `sanitizeTheme` per a temes d'usuari futurs), `js/core/theme.js` (aplica variables CSS a `<html>`, mode `auto`, `data-fx`, emet `themechange`, desa còpia per a l'script anti-parpelleig de `index.html`). `css/app.css` ja només fa servir variables. Selector amb miniatures a `js/ui/settings.js` (`<dialog>` amb tema + idioma; el selector d'idioma ja no és a la barra).
- **Teclat amb gestos** (`keypad.js`, `keys.js`): pàgines Bàsiques/Trigonometria/Avançades amb scroll-snap + pestanyes; bloc numèric fix; pulsació llarga amb variants (marca triangular), també clic dret i ↑. S'ha tret la tecla SHIFT/2a (les inverses són visibles a Trigonometria). Nova tecla **fracció** (`/` apila) i `÷` és divisió en línia (token `'÷'`, `Editor.text` el tradueix a `/` via `TOKEN_SRC`).
- **Notació natural** (`natural.js` pur + `natural-render.js` DOM + `css/natural.css`): fraccions, arrels, exponents, |x|, sobre els mateixos tokens (motor i historial sense canvis). Tocar posa el cursor (`caretFromPoint`).
- **Mòdul d'estadística** (`js/core/stats.js` pur, `js/modules/stats/`, `css/stats.css`): taula x/n editable, pegar d'un full de càlcul, targetes N, x̄, Me, Mo, σ, s, Q1, Q3…, barres i caixa en canvas. Quartils pel mètode de l'ESO (posició N·k/4). `computeBivariate()` (regressió, r) ja fet i provat, **sense interfície**.
- `sw.js` → `v2.0.0` amb tots els fitxers nous; `?nosw` a `main.js`; `.claude/launch.json` per al servidor de previsualització.

## Pendent / següent pas

1. **Revisar la selecció de funcions** de les pàgines (Luis no n'està convençut). Ara segueix el criteri «calculadora tipus Casio»; cal refer-la a partir del currículum (de 1r d'ESO a 2n de Batxillerat): a la vista, el que més es fa servir; a la pulsació llarga, el que es fa servir poc (sinh/cosh/tanh, per exemple); i deixar lloc a Avançades per a la derivada i la integral. Primer, una proposta en taula perquè Luis la validi; després, el codi.
2. **Luis:** provar-la a classe amb el projector (tema Projector).
3. Estadística **bidimensional** per a Batxillerat: UI per a `computeBivariate()` (taula x/y, núvol de punts, recta de regressió, r).
4. Opció a Ajustos per **tornar a la tecla SHIFT** (estil Casio) per a qui la prefereixi.
5. Cursor arrossegable a la fórmula (ara: tocar + ◀ ▶).
6. Temes d'usuari: editor acotat (color d'accent, arrodoniment, estil d'ombra) sobre `sanitizeTheme` + control de contrast.
7. Pàgina «Avançades»: càlcul (derivada numèrica, integral definida) per a Batxillerat. La integral s'ha de dibuixar en notació natural (∫ amb límits i dx), com les fraccions.
8. Mòdul **gràfiques** (`engine.compileFunction`).

## Dubtes oberts

- Decidit sense confirmar: treure SHIFT (les inverses són a la pàgina Trig i amb pulsació llarga); `/` del teclat físic = fracció i `:` = divisió.
- Decidit sense confirmar: si totes les freqüències són iguals no hi ha moda (excepte si només hi ha un valor).
- `~/Projects/docencia/fraccions/` (gargamel) té còpies antigues sense git: revisar si es poden arxivar.

## Arquitectura (resum)

```
index.html (script anti-parpelleig del tema, <dialog id="settings">), sw.js (VERSION + ASSETS)
css/app.css (només variables)  css/natural.css  css/stats.css
js/main.js                      serveis, temes, ajustos, mòduls, SW
js/core/  engine, format, store, i18n, history, registry, theme, stats
js/themes/ presets.js (dades), resolve.js (pur)
js/ui/    history-panel, toast, settings
js/modules/calculator/  index, keys (PAGES, MAIN_KEYS, TOKEN_SRC), keypad (gestos), editor, natural, natural-render, display (resultat)
js/modules/stats/       index, chart, format, texts
tests/    engine, assets, theme, natural, stats
```

Contracte de mòdul (`js/core/registry.js`): `{ id, titleKey, icon?, i18n?, mount(container, ctx), unmount(), onLanguageChange?(), onHistoryPick?(entry, what) }`, amb `ctx = { math, engine, store, i18n, history, toast }`.

## Decisions preses (no re-discutir sense motiu)

- Sense frameworks ni build. Codi i comentaris en **català**; textos UI via `data-i18n` / `i18n.t()` (ca i es).
- Temes = dades; el CSS no coneix cap tema concret (efectes via `[data-fx~="…"]`). Prohibit posar colors fixos al CSS. Tests de contrast obligatoris.
- Motor: avalua en `number`; en paral·lel `config({number:'Fraction'})` (es restaura sempre). El bundle UMD **no** exporta `all`.
- Trigonometria via **scope**: graus/rad, soroll < 1e-14 → 0, `tan(90°)` → error. `log` = log10, `ln` = neperià.
- Editor per **tokens**; la notació natural és només una capa de dibuix sobre els tokens.
- Historial desa expressions autònomes (`Ans` substituït). Llicència GPL-3.0-or-later.
## Coses a vigilar

- Canviar qualsevol fitxer → incrementar `VERSION` a `sw.js`; fitxer nou → afegir-lo a `ASSETS` (`npm test` avisa).
- Per provar en local, `?nosw`; si no, el SW serveix la versió anterior.
- El navegador de l'app de Claude amb el panell **amagat** congela animacions, transicions i esdeveniments de scroll: les captures surten «a mig canvi». No és un error de l'app.
- `vendor/mathjs/package.json` existeix només perquè les proves de Node carreguin el UMD.
