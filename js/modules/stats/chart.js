// Gràfics en <canvas>: diagrama de barres de freqüències i diagrama de caixa.
import { fmt } from './format.js';

function theme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fb) => cs.getPropertyValue(name).trim() || fb;
  return {
    c1: v('--chart-1', '#0B63B6'),
    c2: v('--chart-2', '#B04A00'),
    c3: v('--chart-3', '#2E7D32'),
    ink: v('--ink', '#17202B'),
    muted: v('--muted', '#5A6878'),
    line: v('--line', '#CDD6E1'),
    surface: v('--surface', '#FFFFFF'),
    font: v('--font', 'system-ui, sans-serif'),
  };
}

// Pas "agradable" per als eixos.
function niceStep(range, ticks) {
  const raw = range / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
}

// Prepara el canvas per a devicePixelRatio i retorna {g, w, h}.
function setup(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  return { g, w, h };
}

function drawMessage(g, w, h, th, text) {
  g.fillStyle = th.muted;
  g.font = `15px ${th.font}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2);
}

function drawBars(g, w, h, th, stats, t) {
  const table = stats.table;
  const maxN = Math.max(...table.map((r) => r.n));
  const step = niceStep(maxN, 5);
  const top = Math.ceil(maxN / step) * step;
  const left = 38, right = 10, topPad = 14, bottom = 30;
  const pw = w - left - right, ph = h - topPad - bottom;
  g.font = `12px ${th.font}`;

  // Quadrícula i eix de freqüències.
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  for (let v = 0; v <= top + step / 2; v += step) {
    const y = topPad + ph - (v / top) * ph;
    g.strokeStyle = th.line;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(left, y); g.lineTo(w - right, y); g.stroke();
    g.fillStyle = th.muted;
    g.fillText(fmt(v), left - 6, y);
  }

  const slot = pw / table.length;
  const bw = Math.min(slot * 0.7, 64);
  g.fillStyle = th.c1;
  g.textAlign = 'center';
  // Si hi ha molts valors, es salten etiquetes per no solapar-les.
  const skip = Math.max(1, Math.ceil(30 / slot));
  table.forEach((r, i) => {
    const cx = left + slot * (i + 0.5);
    const bh = (r.n / top) * ph;
    g.fillStyle = th.c1;
    g.fillRect(cx - bw / 2, topPad + ph - bh, bw, bh);
    if (i % skip === 0) {
      g.fillStyle = th.ink;
      g.textBaseline = 'top';
      g.fillText(fmt(r.x), cx, topPad + ph + 8);
    }
  });
  g.strokeStyle = th.ink;
  g.beginPath(); g.moveTo(left, topPad + ph); g.lineTo(w - right, topPad + ph); g.stroke();
}

function drawBox(g, w, h, th, s, t) {
  const left = 16, right = 16;
  const pw = w - left - right;
  let lo = s.min, hi = s.max;
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.05;
  lo -= pad; hi += pad;
  const X = (v) => left + ((v - lo) / (hi - lo)) * pw;
  const axisY = h - 34;
  const cy = (axisY - 10) / 2 + 6;
  const bh = Math.min(70, axisY * 0.5);

  // Eix amb marques.
  const step = niceStep(hi - lo, Math.max(2, Math.floor(pw / 70)));
  g.font = `12px ${th.font}`;
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.strokeStyle = th.line;
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(left, axisY); g.lineTo(w - right, axisY); g.stroke();
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    const x = X(v);
    g.beginPath(); g.moveTo(x, axisY); g.lineTo(x, axisY + 5); g.stroke();
    g.fillStyle = th.muted;
    g.fillText(fmt(Math.round(v / step) * step), x, axisY + 8);
  }

  // Bigotis.
  g.strokeStyle = ink(th);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(X(s.min), cy); g.lineTo(X(s.q1), cy);
  g.moveTo(X(s.q3), cy); g.lineTo(X(s.max), cy);
  g.moveTo(X(s.min), cy - bh / 4); g.lineTo(X(s.min), cy + bh / 4);
  g.moveTo(X(s.max), cy - bh / 4); g.lineTo(X(s.max), cy + bh / 4);
  g.stroke();

  // Caixa Q1–Q3 i mediana.
  const bx = X(s.q1), bwid = Math.max(2, X(s.q3) - X(s.q1));
  g.fillStyle = th.c1;
  g.globalAlpha = 0.35;
  g.fillRect(bx, cy - bh / 2, bwid, bh);
  g.globalAlpha = 1;
  g.strokeStyle = th.c1;
  g.strokeRect(bx, cy - bh / 2, bwid, bh);
  g.strokeStyle = th.ink;
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(X(s.median), cy - bh / 2); g.lineTo(X(s.median), cy + bh / 2); g.stroke();

  // Mitjana: línia discontínua.
  g.strokeStyle = th.c2;
  g.lineWidth = 2;
  g.setLineDash([5, 4]);
  g.beginPath(); g.moveTo(X(s.mean), cy - bh / 2 - 8); g.lineTo(X(s.mean), cy + bh / 2 + 8); g.stroke();
  g.setLineDash([]);

  // Etiquetes dels cinc valors.
  g.font = `12px ${th.font}`;
  g.fillStyle = th.ink;
  g.textBaseline = 'bottom';
  const labels = [[s.min, 'min'], [s.q1, 'Q1'], [s.median, 'Me'], [s.q3, 'Q3'], [s.max, 'max']];
  let lastEnd = -Infinity;
  labels.forEach(([v, name], i) => {
    const text = `${i === 0 ? t('stats.shortMin') : i === 4 ? t('stats.shortMax') : name} ${fmt(v)}`;
    const x = Math.min(Math.max(X(v), left + g.measureText(text).width / 2), w - right - g.measureText(text).width / 2);
    const half = g.measureText(text).width / 2;
    const row = x - half < lastEnd + 4 ? 1 : 0; // alterna alçada si se solapen
    if (row === 0) lastEnd = x + half;
    g.fillText(text, x, cy - bh / 2 - 12 - row * 15);
  });
  g.fillStyle = th.c2;
  g.textBaseline = 'top';
  const mt = `${t('stats.mean')} ${fmt(s.mean)}`;
  const mx = Math.min(Math.max(X(s.mean), left + g.measureText(mt).width / 2), w - right - g.measureText(mt).width / 2);
  g.fillText(mt, mx, cy + bh / 2 + 10);
}

const ink = (th) => th.ink;

export function drawChart(canvas, kind, stats, t) {
  const th = theme();
  const { g, w, h } = setup(canvas);
  if (!stats || stats.empty) {
    drawMessage(g, w, h, th, t('stats.empty'));
    return;
  }
  if (kind === 'box') drawBox(g, w, h, th, stats, t);
  else drawBars(g, w, h, th, stats, t);
}

export function chartLabel(kind, stats, t) {
  if (!stats || stats.empty) return t('stats.empty');
  if (kind === 'box') {
    return t('stats.ariaBox', {
      min: fmt(stats.min), q1: fmt(stats.q1), me: fmt(stats.median),
      q3: fmt(stats.q3), max: fmt(stats.max), mean: fmt(stats.mean),
    });
  }
  return t('stats.ariaBars', { k: stats.table.length, N: stats.N });
}
