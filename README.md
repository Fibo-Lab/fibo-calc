# Fibo Calc — Calculadora científica (PWA)

Calculadora científica web instal·lable, feta amb HTML, CSS i JavaScript sense frameworks, sobre [math.js](https://mathjs.org).
Interfície en **català** i **castellà**. Llicència **GPL-3.0-or-later**.

**Prova-la i instal·la-la: https://fibo-lab.github.io/fibo-calc/** (no cal APK: al mòbil, obre l'enllaç i tria «Afegeix a la pantalla d'inici» / «Instal·la l'app»).

*[Resumen en castellano más abajo.](#castellano)*

## Funcionalitats

**Novetats de la v2**

- **Pantalla amb notació natural**: les fraccions es veuen apilades, les arrels amb barra i els exponents elevats. Toca qualsevol part de la fórmula per posar-hi el cursor. La tecla de fracció (▭/▭) apila; `÷` divideix en línia.
- **Teclat per pàgines**: *Bàsiques*, *Trigonometria* i *Avançades*. Llisca amb el dit sobre les funcions o toca la pestanya. Els números i les operacions bàsiques **no es mouen mai**.
- **Pulsació llarga** a les tecles amb un triangle a la cantonada (p. ex. `sin` → `sin⁻¹`, `sinh`; `√` → `∛`, `ⁿ√`). Les inverses també són visibles a la pàgina de trigonometria. Amb ratolí: clic dret; amb teclat: fletxa amunt.
- **Temes**: Automàtic, Clar, Fosc, **Projector** (alt contrast per a classe), Ciberpunk i Zen. Botó de la paleta, a dalt a la dreta.
- **Estadística** (pestanya): taula de freqüències editable, pegar dades d'un full de càlcul, targetes amb N, x̄, Me, Mo, σ, s, Q1, Q3…, diagrama de barres i de caixa. Quartils pel mètode habitual a l'ESO.

**De sempre**

- **Resultat exacte o decimal**: `1/3+1/4` → `7/12`. També reconeix múltiples de π (`2π/3`) i arrels (`√2/2`, `2√2`). Es canvia amb la tecla `S⇔D` o amb el xip `EXACTE/DECIMAL`. A sota es veu sempre l'altra forma.
- **Graus / radiants**: xip `GRAUS/RAD` (o la tecla de la pàgina de trigonometria). `sin(30)` = `1/2` en graus; `tan(90)` dona «Resultat no definit».
- **Vista prèvia** del resultat mentre s'escriu i tancament automàtic de parèntesis.
- **Historial** persistent (100 operacions): toca l'expressió per tornar-la a editar o el resultat per inserir-lo.
- **Sense connexió**: un *service worker* desa tota l'app; math.js va inclòs a `vendor/`.
- **Teclat físic**: dígits, operadors, `Enter`/`=`, `Retrocés`, `Esc`, fletxes, `Inici`/`Fi`. `/` és fracció i `:` divisió. La coma `,` és decimal i `;` separa arguments (`log(8;2)`). També es pot enganxar text.
- Toca el resultat per copiar-lo. Accessible amb lector de pantalla.

## Temes: com afegir-ne un

Els temes són **només dades** a `js/themes/presets.js`. Cada tema hereta (`extends`) d'un altre i només redefineix el que canvia:

```js
export const pissarra = {
  id: 'pissarra', extends: 'dark', name: { ca: 'Pissarra', es: 'Pizarra' },
  tokens: {
    color: { bg: '#1F3B2D', screen: '#24453A', accent: '#F5F0C8' },
    shape: { 'key-radius': '6px' },          // de 0 (quadrat) a 999px (píndola)
    depth: { 'key-shadow': 'none' },          // pla, neó, relleu...
  },
  fx: [],                                     // efectes extra: 'glow', 'scanlines', 'quiet'
};
```

Afegeix-lo a `PRESETS` i a `PICKER_ORDER` i ja surt al selector amb la seva miniatura. Grups de tokens: `color`, `shape`, `depth`, `type`, `motion` (la llista completa és el tema `base`). El CSS (`css/*.css`) només fa servir variables; mai colors fixos. `npm test` comprova que tots els temes estan complets i que el text té **contrast WCAG** suficient. Per als temes d'usuari futurs ja hi ha `sanitizeTheme()` a `js/themes/resolve.js`.

### Notes de sintaxi

| Tecla | Significat | Exemple |
|---|---|---|
| `log` | logaritme decimal | `log(1000)` = 3 |
| `ln` | logaritme neperià | `ln(e^2)` = 2 |
| `log(x; b)` | logaritme en base b | `log(8;2)` = 3 |
| `nCr` | combinacions | `nCr(5;2)` = 10 |
| `%` | percentatge | `50%` = 1/2 |
| `×10ˣ` | notació científica | `3×10^(8)` |

## Posar-la en marxa

Els mòduls ES i el service worker necessiten un servidor (no funciona obrint el fitxer amb doble clic):

```sh
cd fibo-calc
python3 -m http.server 8080      # o: npm start
# obre http://localhost:8080
```

Per publicar-la n'hi ha prou amb servir aquest repositori per HTTPS (p. ex. GitHub Pages). Des del navegador del mòbil, «Afegeix a la pantalla d'inici» la instal·la com una app.

Proves (Node 18 o posterior, sense dependències):

```sh
npm test
```

## Estructura

```
fibo-calc/
├── index.html               Esquelet: barra superior, vista del mòdul, historial
├── manifest.webmanifest     Manifest de la PWA
├── sw.js                    Service worker (llista d'arxius + VERSION)
├── css/                     Estils: app.css (només variables de tema), natural.css, stats.css
├── icons/                   Icones (SVG i PNG)
├── vendor/mathjs/           math.js 15.2.0 (Apache-2.0)
├── js/
│   ├── main.js              Punt d'entrada: serveis, registre de mòduls, SW
│   ├── core/                Lògica sense interfície, reutilitzable
│   │   ├── engine.js        Motor: avaluació, exacte/decimal, graus/radiants, compileFunction()
│   │   ├── format.js        Fraccions, π, arrels i format de nombres (funcions pures)
│   │   ├── history.js       Historial persistent
│   │   ├── i18n.js          Traduccions (data-i18n, i18n.extend)
│   │   ├── registry.js      Registre de mòduls
│   │   ├── stats.js         Estadística (funcions pures, mètode de quartils de l'ESO)
│   │   ├── store.js         Configuració reactiva (idioma, angle, format, mòdul, tema)
│   │   └── theme.js         Aplica el tema com a variables CSS
│   ├── i18n/ca.js, es.js    Textos
│   ├── themes/              Temes (dades) i resolució/validació (pur)
│   ├── ui/                  Components compartits (historial, avisos, ajustos)
│   └── modules/
│       ├── calculator/      Calculadora: teclat amb gestos, editor, notació natural
│       └── stats/           Estadística: taula, targetes, gràfics
└── tests/                   Proves: motor, temes, notació natural, estadística, SW
```

## Afegir un mòdul (gràfiques, estadística...)

Cada mòdul és una carpeta dins `js/modules/` que exporta un objecte. Quan n'hi ha més d'un, apareixen pestanyes a la barra superior.

1. Crea `js/modules/stats/index.js`:

   ```js
   export default {
     id: 'stats',
     titleKey: 'module.stats',
     i18n: {
       ca: { 'module.stats': 'Estadística' },
       es: { 'module.stats': 'Estadística' },
     },
     mount(container, { math, engine, store, i18n, history, toast }) {
       container.innerHTML = '<section class="display">…</section>';
       // math.mean([...]), math.median(...), math.std(...)
       // history.add({ module: 'stats', exprText, decimalText, exactText, valueSrc, tokens })
     },
     unmount() { /* treu listeners globals */ },
     onLanguageChange() { /* torna a pintar textos dinàmics */ },
     onHistoryPick(entry, what) { /* what: 'expr' | 'result' */ },
   };
   ```

2. Registra'l a `js/main.js` (`stats` ja hi és; hi ha una línia comentada per a `graphs`).
3. Afegeix els fitxers nous a la llista `ASSETS` de `sw.js` i incrementa `VERSION`. La prova `npm test` avisa si te n'oblides.

Per al **mòdul de gràfiques**, `engine.compileFunction('x^2 + sin(x)')` retorna una funció `f(x)` que respecta el mode d'angle i les funcions `log`/`ln` de la calculadora. Recompila-la si canvia `store.get().angle`.

## Llicència

Copyright © 2026 els autors. Aquest programa és programari lliure: podeu redistribuir-lo i/o modificar-lo sota els termes de la **Llicència Pública General de GNU, versió 3** o (a la vostra elecció) qualsevol versió posterior. Vegeu [`LICENSE`](LICENSE).

math.js © Jos de Jong i col·laboradors, sota llicència Apache 2.0 (compatible amb GPL-3.0): vegeu `vendor/mathjs/LICENSE`.

---

<a id="castellano"></a>
## Castellano

**Pruébala e instálala: https://fibo-lab.github.io/fibo-calc/** (sin APK: desde el móvil, abre el enlace y elige «Añadir a la pantalla de inicio» / «Instalar app»).

Calculadora científica web instalable (PWA) en HTML, CSS y JavaScript sin frameworks, con math.js. Interfaz en catalán y castellano (selector arriba a la derecha).

- **Novedades v2**: pantalla con **notación natural** tocable (fracciones apiladas, raíces, exponentes); teclado por **páginas** (Básicas, Trigonometría, Avanzadas) que se cambian deslizando, con los números siempre fijos; **pulsación larga** para variantes (`sin` → `sin⁻¹`, `sinh`); **temas** Automático, Claro, Oscuro, Proyector, Cyberpunk y Zen; módulo de **estadística** con tabla de frecuencias, parámetros y gráficos.
- Resultado **exacto** (fracción, múltiplos de π, raíces) o **decimal**: tecla `S⇔D` o el chip `EXACTO/DECIMAL`.
- Modo **grados/radianes** con el chip `GRADOS/RAD`.
- **Historial** persistente: toca la expresión para editarla o el resultado para insertarlo.
- Funciona **sin conexión** gracias al service worker; math.js va incluido en `vendor/`.
- `log` es el logaritmo decimal y `ln` el neperiano. La coma `,` es decimal y `;` separa argumentos.

Arranque: `cd fibo-calc && python3 -m http.server 8080` y abre `http://localhost:8080`. Pruebas: `npm test`.

El código está organizado en módulos (`js/core` sin interfaz, `js/modules/*` para cada pantalla). Para añadir los módulos de **gráficas** y **estadística**, sigue los pasos de la sección «Afegir un mòdul»: crear la carpeta, registrarlo en `js/main.js` y añadir sus archivos a `sw.js`.

Licencia GPL-3.0-or-later (ver `LICENSE`).
