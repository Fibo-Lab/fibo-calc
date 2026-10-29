# Calculadora científica (PWA)

Calculadora científica web instal·lable, feta amb HTML, CSS i JavaScript sense frameworks, sobre [math.js](https://mathjs.org).
Interfície en **català** i **castellà**. Llicència **GPL-3.0-or-later**.

*[Resumen en castellano más abajo.](#castellano)*

## Funcionalitats

- **Teclat en pantalla per a mòbil**: tecles grans, segona funció (`2a`) amb l'etiqueta sempre visible a sobre, cursor mòbil (◀ ▶ o tocant l'expressió) i esborrat per tokens (`⌫` treu `sin(` sencer).
- **Resultat exacte o decimal**: `1/3+1/4` → `7/12`. També reconeix múltiples de π (`2π/3`) i arrels (`√2/2`, `2√2`). Es canvia amb la tecla `S⇔D` o amb el xip `EXACTE/DECIMAL`. A sota es veu sempre l'altra forma.
- **Graus / radiants**: xip `GRAUS/RAD`. `sin(30)` = `1/2` en graus; `tan(90)` dona «Resultat no definit».
- **Vista prèvia** del resultat mentre s'escriu i tancament automàtic de parèntesis (es veuen en gris).
- **Historial** persistent (100 operacions): toca l'expressió per tornar-la a editar o el resultat per inserir-lo. `Ans` es desa substituït pel seu valor perquè cada entrada sigui autònoma.
- **Sense connexió**: un *service worker* desa tota l'app; math.js va inclòs a `vendor/` (no depèn de cap CDN).
- **Teclat físic**: dígits, operadors, `Enter`/`=`, `Retrocés`, `Esc` (esborra), fletxes, `Inici`/`Fi`. La coma `,` és la coma decimal i `;` separa arguments (`log(8;2)`). També es pot enganxar text.
- Toca el resultat per copiar-lo. Mode fosc automàtic. Accessible amb lector de pantalla.

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
cd calculadora
python3 -m http.server 8080      # o: npm start
# obre http://localhost:8080
```

Per publicar-la n'hi ha prou amb servir la carpeta `calculadora/` per HTTPS (p. ex. GitHub Pages). Des del navegador del mòbil, «Afegeix a la pantalla d'inici» la instal·la com una app.

Proves (Node 18 o posterior, sense dependències):

```sh
npm test
```

## Estructura

```
calculadora/
├── index.html               Esquelet: barra superior, vista del mòdul, historial
├── manifest.webmanifest     Manifest de la PWA
├── sw.js                    Service worker (llista d'arxius + VERSION)
├── css/app.css              Estils (mòbil primer, mode fosc)
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
│   │   └── store.js         Configuració reactiva (idioma, angle, format, mòdul)
│   ├── i18n/ca.js, es.js    Textos
│   ├── ui/                  Components compartits (historial, avisos)
│   └── modules/
│       └── calculator/      Mòdul calculadora (teclat, editor, pantalla)
└── tests/                   Proves del motor i de la llista del service worker
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

2. Registra'l a `js/main.js` (hi ha les línies comentades per a `graphs` i `stats`).
3. Afegeix els fitxers nous a la llista `ASSETS` de `sw.js` i incrementa `VERSION`. La prova `npm test` avisa si te n'oblides.

Per al **mòdul de gràfiques**, `engine.compileFunction('x^2 + sin(x)')` retorna una funció `f(x)` que respecta el mode d'angle i les funcions `log`/`ln` de la calculadora. Recompila-la si canvia `store.get().angle`.

## Llicència

Copyright © 2026 els autors. Aquest programa és programari lliure: podeu redistribuir-lo i/o modificar-lo sota els termes de la **Llicència Pública General de GNU, versió 3** o (a la vostra elecció) qualsevol versió posterior. Vegeu [`LICENSE`](LICENSE).

math.js © Jos de Jong i col·laboradors, sota llicència Apache 2.0 (compatible amb GPL-3.0): vegeu `vendor/mathjs/LICENSE`.

---

<a id="castellano"></a>
## Castellano

Calculadora científica web instalable (PWA) en HTML, CSS y JavaScript sin frameworks, con math.js. Interfaz en catalán y castellano (selector arriba a la derecha).

- Teclado en pantalla optimizado para móvil, con segunda función (`2ª`) y cursor.
- Resultado **exacto** (fracción, múltiplos de π, raíces) o **decimal**: tecla `S⇔D` o el chip `EXACTO/DECIMAL`.
- Modo **grados/radianes** con el chip `GRADOS/RAD`.
- **Historial** persistente: toca la expresión para editarla o el resultado para insertarlo.
- Funciona **sin conexión** gracias al service worker; math.js va incluido en `vendor/`.
- `log` es el logaritmo decimal y `ln` el neperiano. La coma `,` es decimal y `;` separa argumentos.

Arranque: `cd calculadora && python3 -m http.server 8080` y abre `http://localhost:8080`. Pruebas: `npm test`.

El código está organizado en módulos (`js/core` sin interfaz, `js/modules/*` para cada pantalla). Para añadir los módulos de **gráficas** y **estadística**, sigue los pasos de la sección «Afegir un mòdul»: crear la carpeta, registrarlo en `js/main.js` y añadir sus archivos a `sw.js`.

Licencia GPL-3.0-or-later (ver `LICENSE`).
