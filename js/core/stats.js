// Estadística descriptiva d'una variable amb freqüències. Funcions PURES (sense DOM).
// Entrada: llista de {x, n} (valor i freqüència absoluta, n enter ≥ 0).
// Quartils pel mètode d'ESO: posició p = N·k/4; si p és enter, mitjana dels valors
// a les posicions p i p+1 (comptant des d'1); si no, el valor a la posició ceil(p).

// Converteix text a nombre; accepta coma o punt decimal. Retorna null si no és vàlid.
export function parseNumber(str) {
  if (typeof str === 'number') return Number.isFinite(str) ? str : null;
  if (typeof str !== 'string') return null;
  const s = str.trim().replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(',', '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

// Normalitza files: agrupa per x, ignora buides, no numèriques i amb n no enter ≥ 0.
// Les files amb n = 0 s'ignoren (no aporten dades).
export function normalizeRows(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const x = parseNumber(r?.x);
    const n = parseNumber(r?.n);
    if (x === null || n === null || !Number.isInteger(n) || n < 0) continue;
    if (n === 0) continue;
    map.set(x, (map.get(x) || 0) + n);
  }
  return [...map.entries()].map(([x, n]) => ({ x, n })).sort((a, b) => a.x - b.x);
}

export function computeStats(rows) {
  const data = normalizeRows(rows);
  const N = data.reduce((s, r) => s + r.n, 0);
  if (N === 0) return { empty: true, N: 0, table: [], modes: [] };

  let cum = 0;
  const table = data.map((r) => {
    cum += r.n;
    return { x: r.x, n: r.n, f: r.n / N, N: cum, F: cum / N };
  });

  const valueAt = (pos) => table.find((r) => r.N >= pos).x;
  const quantile = (k) => {
    const p = (N * k) / 4;
    return Number.isInteger(p) ? (valueAt(p) + valueAt(p + 1)) / 2 : valueAt(Math.ceil(p));
  };

  const sum = data.reduce((s, r) => s + r.x * r.n, 0);
  const mean = sum / N;
  const ss = data.reduce((s, r) => s + r.n * (r.x - mean) ** 2, 0);
  const varPop = ss / N;
  const varSample = N > 1 ? ss / (N - 1) : null;

  const maxN = Math.max(...data.map((r) => r.n));
  const minN = Math.min(...data.map((r) => r.n));
  // Sense moda si totes les freqüències són iguals (llevat d'un únic valor).
  const modes = maxN === minN && data.length > 1 ? [] : data.filter((r) => r.n === maxN).map((r) => r.x);

  const min = data[0].x;
  const max = data[data.length - 1].x;
  const q1 = quantile(1);
  const q3 = quantile(3);

  return {
    empty: false,
    N, sum, mean,
    median: quantile(2),
    modes,
    varPop, sdPop: Math.sqrt(varPop),
    varSample, sdSample: varSample === null ? null : Math.sqrt(varSample),
    q1, q3, iqr: q3 - q1,
    min, max, range: max - min,
    table,
  };
}

// Divideix una línia en cel·les: tabulador o ';' si n'hi ha; si no, espais.
// La coma només separa si va seguida d'espai o n'hi ha més d'una (si no, és decimal).
function splitLine(line) {
  const l = line.trim();
  if (/[\t;]/.test(l)) return l.split(/[\t;]+/).map((c) => c.trim()).filter(Boolean);
  if (/,\s|,.*,/.test(l)) return l.split(/\s*,\s*|\s+/).filter(Boolean);
  return l.split(/\s+/).filter(Boolean);
}

// Converteix text enganxat d'un full de càlcul en files {x, n}.
// 1 columna = llista de dades (es compten); 2 columnes = x i n. Salta capçaleres.
export function parsePasted(text) {
  const lines = String(text ?? '').split(/\r?\n/).map(splitLine).filter((c) => c.length);
  if (!lines.length) return [];
  const numeric = lines.filter((c) => parseNumber(c[0]) !== null);
  if (!numeric.length) return [];
  const maxCols = Math.max(...numeric.map((c) => c.length));
  const pairs = maxCols === 2 || (maxCols > 2 && numeric.length > 1);

  const map = new Map();
  const add = (x, n) => map.set(x, (map.get(x) || 0) + n);
  for (const cells of numeric) {
    if (pairs) {
      const x = parseNumber(cells[0]);
      const n = parseNumber(cells[1]);
      if (x !== null && n !== null && Number.isInteger(n) && n > 0) add(x, n);
    } else {
      for (const c of cells) {
        const x = parseNumber(c);
        if (x !== null) add(x, 1);
      }
    }
  }
  return [...map.entries()].map(([x, n]) => ({ x, n }));
}

// --- Dues variables (preparat per a una UI futura) ---
// Entrada: llista de {x, y} (admet text amb coma decimal). Ignora parelles no numèriques.
// Retorna covariància poblacional, coeficient de correlació r i la recta y = a + b·x
// (b = cov/σx², a = ȳ − b·x̄). r i la recta són null si σx o σy valen 0.
export function computeBivariate(points) {
  const pts = [];
  for (const p of points || []) {
    const x = parseNumber(p?.x);
    const y = parseNumber(p?.y);
    if (x !== null && y !== null) pts.push({ x, y });
  }
  const n = pts.length;
  if (n === 0) return { empty: true, n: 0 };
  const meanX = pts.reduce((s, p) => s + p.x, 0) / n;
  const meanY = pts.reduce((s, p) => s + p.y, 0) / n;
  const sxx = pts.reduce((s, p) => s + (p.x - meanX) ** 2, 0);
  const syy = pts.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const sxy = pts.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0);
  const b = sxx > 0 ? sxy / sxx : null;
  return {
    empty: false, n, meanX, meanY,
    varX: sxx / n, varY: syy / n,
    sdX: Math.sqrt(sxx / n), sdY: Math.sqrt(syy / n),
    cov: sxy / n,
    r: sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null,
    b,
    a: b === null ? null : meanY - b * meanX,
    r2: sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : null,
  };
}
