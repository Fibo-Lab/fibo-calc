// Mòdul d'estadística: una variable amb freqüències (nivell ESO).

import { createStore } from '../../core/store.js';
import { computeStats, parsePasted, parseNumber } from '../../core/stats.js';
import { drawChart, chartLabel } from './chart.js';
import { fmt } from './format.js';
import texts from './texts.js';

const ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V4"/><path d="M4 20h16"/><rect x="8" y="12" width="3" height="5"/><rect x="13" y="7" width="3" height="10"/><rect x="18" y="14" width="2" height="3" stroke="none" fill="currentColor"/></svg>';

// Notes d'un examen de 2n d'ESO (x = nota, n = nombre d'alumnes).
const EXAMPLE = [[3, 1], [4, 2], [5, 4], [6, 6], [7, 5], [8, 4], [9, 2], [10, 1]]
  .map(([x, n]) => ({ x: String(x), n: String(n) }));

const CARDS = [
  { id: 'N', label: 'N', name: 'stats.N', val: (s) => String(s.N) },
  { id: 'xbar', label: 'x̄', name: 'stats.xbar', val: (s) => fmt(s.mean) },
  { id: 'Me', label: 'Me', name: 'stats.Me', val: (s) => fmt(s.median) },
  { id: 'Mo', label: 'Mo', name: 'stats.Mo', val: (s, t) => (s.modes.length ? s.modes.map(fmt).join('; ') : t('stats.noMode')) },
  { id: 'sigma', label: 'σ', name: 'stats.sigma', val: (s) => fmt(s.sdPop) },
  { id: 's', label: 's', name: 'stats.s', val: (s) => fmt(s.sdSample) },
  { id: 'Q1', label: 'Q1', name: 'stats.Q1', val: (s) => fmt(s.q1) },
  { id: 'Q3', label: 'Q3', name: 'stats.Q3', val: (s) => fmt(s.q3) },
  { id: 'min', labelKey: 'stats.shortMin', name: 'stats.min', val: (s) => fmt(s.min) },
  { id: 'max', labelKey: 'stats.shortMax', name: 'stats.max', val: (s) => fmt(s.max) },
  { id: 'range', labelKey: 'stats.shortRange', name: 'stats.range', val: (s) => fmt(s.range) },
];

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

export default {
  id: 'stats',
  titleKey: 'module.stats',
  icon: ICON,
  i18n: texts,

  mount(container, ctx) {
    const { i18n, toast } = ctx;
    const t = i18n.t;
    const store = createStore('calc.stats', { rows: null, chart: 'bars' });
    // Primera vegada (rows === null): carrega l'exemple perquè la demostració llueixi.
    let rows = (store.get().rows || EXAMPLE).map((r) => ({ x: String(r.x ?? ''), n: String(r.n ?? '') }));
    if (store.get().rows === null) store.set({ rows });
    let chartKind = store.get().chart === 'box' ? 'box' : 'bars';
    let stats = null;
    const cleanups = [];
    const listen = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    };

    // --- Estructura ---
    const root = el('div', { class: 'st-root' });
    const cardsSec = el('section', { class: 'st-cards', 'aria-label': t('stats.summary'), 'data-i18n-attr': 'aria-label:stats.summary' });
    const cardEls = CARDS.map((c) => {
      const k = el('span', { class: 'st-card-k' });
      const v = el('span', { class: 'st-card-v' });
      const b = el('button', { type: 'button', class: 'st-card' }, k, v);
      cardsSec.append(b);
      return { def: c, btn: b, k, v, text: '' };
    });

    const chartSec = el('section', { class: 'st-chart-sec' });
    const segBars = el('button', { type: 'button', class: 'st-seg', 'data-i18n': 'stats.chartBars' });
    const segBox = el('button', { type: 'button', class: 'st-seg', 'data-i18n': 'stats.chartBox' });
    const seg = el('div', { class: 'st-segs', role: 'group', 'data-i18n-attr': 'aria-label:stats.chart' }, segBars, segBox);
    const canvas = el('canvas', { class: 'st-canvas', role: 'img' });
    const canvasWrap = el('div', { class: 'st-canvas-wrap' }, canvas);
    chartSec.append(seg, canvasWrap);

    const tableSec = el('section', { class: 'st-table-sec', 'aria-labelledby': 'st-table-title' });
    const tableHead = el('div', { class: 'st-table-head' },
      el('h2', { class: 'st-h', id: 'st-table-title', 'data-i18n': 'stats.table' }));
    const toolbar = el('div', { class: 'st-toolbar' });
    const mkBtn = (key, extra = '') => el('button', { type: 'button', class: `st-btn ${extra}`.trim(), 'data-i18n': key });
    const btnPaste = mkBtn('stats.paste');
    const btnSort = mkBtn('stats.sort');
    const btnExample = mkBtn('stats.example');
    const btnClear = mkBtn('stats.clear');
    toolbar.append(btnPaste, btnSort, btnExample, btnClear);
    const tbody = el('tbody');
    const th = (sym, key) => el('th', { scope: 'col', title: t(key), 'data-i18n-attr': `title:${key}` },
      el('span', { 'aria-hidden': 'true', text: sym }), el('span', { class: 'st-sr', 'data-i18n': key }));
    const table = el('table', { class: 'st-table' },
      el('thead', {}, el('tr', {}, th('xᵢ', 'stats.colX'), th('nᵢ', 'stats.colN'), th('fᵢ', 'stats.colF'), th('Nᵢ', 'stats.colCum'), el('th', { class: 'st-th-del' }))),
      tbody);
    const btnAdd = el('button', { type: 'button', class: 'st-btn st-btn-add', 'data-i18n': 'stats.addRow' });
    tableSec.append(tableHead, toolbar, el('div', { class: 'st-table-scroll' }, table), btnAdd);

    // Diàleg per enganxar dades.
    const dlgText = el('textarea', { class: 'st-textarea', rows: '8', spellcheck: 'false', 'data-i18n-attr': 'aria-label:stats.paste' });
    const dlgMsg = el('p', { class: 'st-dlg-msg', role: 'alert' });
    const dlgAdd = el('button', { type: 'button', class: 'st-btn st-btn-primary', 'data-i18n': 'stats.pasteAdd' });
    const dlgRep = el('button', { type: 'button', class: 'st-btn', 'data-i18n': 'stats.pasteReplace' });
    const dlgCancel = el('button', { type: 'button', class: 'st-btn', 'data-i18n': 'stats.cancel' });
    const dlg = el('dialog', { class: 'st-dialog' },
      el('h2', { class: 'st-h', 'data-i18n': 'stats.paste' }),
      el('p', { class: 'st-dlg-help', 'data-i18n': 'stats.pasteHelp' }),
      dlgText, dlgMsg,
      el('div', { class: 'st-dlg-actions' }, dlgCancel, dlgRep, dlgAdd));

    root.append(cardsSec, chartSec, tableSec, dlg);
    container.replaceChildren(root);

    // --- Lògica ---
    const persist = () => store.set({ rows: rows.map((r) => ({ ...r })) });

    function renderComputed() {
      stats = computeStats(rows);
      const byX = new Map((stats.table || []).map((r) => [r.x, r]));
      [...tbody.rows].forEach((tr, i) => {
        const g = byX.get(parseNumber(rows[i].x));
        const valid = g && parseNumber(rows[i].n) !== null;
        tr.querySelector('.st-f').textContent = valid ? fmt(g.f) : '';
        tr.querySelector('.st-cum').textContent = valid ? String(g.N) : '';
      });
      for (const c of cardEls) {
        c.k.textContent = c.def.label ?? t(c.def.labelKey);
        c.text = stats.empty ? '–' : c.def.val(stats, t);
        c.v.textContent = c.text;
        c.btn.setAttribute('aria-label', `${t(c.def.name)}: ${c.text}`);
        c.btn.title = t(c.def.name);
      }
      segBars.setAttribute('aria-pressed', String(chartKind === 'bars'));
      segBox.setAttribute('aria-pressed', String(chartKind === 'box'));
      drawNow();
    }

    function drawNow() {
      canvas.setAttribute('aria-label', chartLabel(chartKind, stats, t));
      drawChart(canvas, chartKind, stats, t);
    }

    function buildRow(r, i) {
      const input = (field, labelKey) => el('input', {
        class: 'st-input', type: 'text', inputmode: 'decimal', autocomplete: 'off',
        enterkeyhint: field === 'x' ? 'next' : 'done',
        'aria-label': t(labelKey, { n: i + 1 }), 'data-field': field,
        value: r[field],
      });
      const del = el('button', { type: 'button', class: 'st-del', 'aria-label': t('stats.delRow', { n: i + 1 }), text: '×' });
      del.dataset.del = '1';
      return el('tr', { 'data-i': String(i) },
        el('td', {}, input('x', 'stats.valueOf')),
        el('td', {}, input('n', 'stats.freqOf')),
        el('td', { class: 'st-calc st-f' }),
        el('td', { class: 'st-calc st-cum' }),
        el('td', { class: 'st-td-del' }, del));
    }

    function renderTable(focus) {
      tbody.replaceChildren(...rows.map(buildRow));
      renderComputed();
      if (focus) tbody.querySelector(`tr[data-i="${focus.i}"] [data-field="${focus.field}"]`)?.focus();
    }

    function setRows(next, focus) {
      rows = next.length ? next : [{ x: '', n: '' }];
      persist();
      renderTable(focus);
    }

    const toRows = (parsed) => parsed.map((r) => ({ x: String(r.x).replace('.', ','), n: String(r.n) }));
    const isBlank = (r) => r.x.trim() === '' && r.n.trim() === '';

    function addRow() {
      rows.push({ x: '', n: '' });
      persist();
      renderTable({ i: rows.length - 1, field: 'x' });
      tbody.lastElementChild?.scrollIntoView?.({ block: 'nearest' });
    }

    function applyPasted(text, replace) {
      const parsed = toRows(parsePasted(text));
      if (!parsed.length) return false;
      setRows(replace ? parsed : [...rows.filter((r) => !isBlank(r)), ...parsed]);
      return true;
    }

    // Ordena per x i fusiona valors repetits.
    function sortRows() {
      const norm = computeStats(rows).table;
      const invalid = rows.filter((r) => parseNumber(r.x) === null || parseNumber(r.n) === null);
      setRows([...toRows(norm), ...invalid.filter((r) => !isBlank(r))]);
    }

    // --- Esdeveniments ---
    listen(tbody, 'input', (e) => {
      const inp = e.target.closest('input');
      if (!inp) return;
      const i = Number(inp.closest('tr').dataset.i);
      rows[i][inp.dataset.field] = inp.value;
      persist();
      renderComputed();
    });
    listen(tbody, 'keydown', (e) => {
      const inp = e.target.closest('input');
      if (!inp || e.key !== 'Enter') return;
      e.preventDefault();
      const i = Number(inp.closest('tr').dataset.i);
      if (inp.dataset.field === 'x') tbody.querySelector(`tr[data-i="${i}"] [data-field="n"]`)?.focus();
      else if (i === rows.length - 1) addRow();
      else tbody.querySelector(`tr[data-i="${i + 1}"] [data-field="x"]`)?.focus();
    });
    listen(tbody, 'click', (e) => {
      const del = e.target.closest('[data-del]');
      if (!del) return;
      const i = Number(del.closest('tr').dataset.i);
      setRows(rows.filter((_, j) => j !== i), { i: Math.min(i, rows.length - 2), field: 'x' });
    });
    // Enganxar directament sobre la taula: només si són diverses dades (si no, deixa el comportament natural).
    listen(tableSec, 'paste', (e) => {
      const text = e.clipboardData?.getData('text') || '';
      if (!/[\n\t;]/.test(text.trim()) && !/\s\S/.test(text.trim())) return;
      if (applyPasted(text, false)) e.preventDefault();
    });

    listen(btnAdd, 'click', addRow);
    listen(btnSort, 'click', sortRows);
    listen(btnExample, 'click', () => setRows(EXAMPLE.map((r) => ({ ...r }))));
    listen(btnClear, 'click', () => setRows([{ x: '', n: '' }], { i: 0, field: 'x' }));

    listen(btnPaste, 'click', () => {
      dlgText.value = '';
      dlgMsg.textContent = '';
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      dlgText.focus();
    });
    const closeDlg = () => (typeof dlg.close === 'function' ? dlg.close() : dlg.removeAttribute('open'));
    const doPaste = (replace) => {
      if (applyPasted(dlgText.value, replace)) closeDlg();
      else dlgMsg.textContent = t('stats.pasteNone');
    };
    listen(dlgAdd, 'click', () => doPaste(false));
    listen(dlgRep, 'click', () => doPaste(true));
    listen(dlgCancel, 'click', closeDlg);

    listen(cardsSec, 'click', async (e) => {
      const card = cardEls.find((c) => c.btn === e.target.closest('.st-card'));
      if (!card || !card.text || card.text === '–' || !navigator.clipboard) return;
      try {
        await navigator.clipboard.writeText(card.text);
        toast(t('stats.copied'));
      } catch { /* sense permís per copiar */ }
    });

    const setChart = (kind) => {
      chartKind = kind;
      store.set({ chart: kind });
      segBars.setAttribute('aria-pressed', String(kind === 'bars'));
      segBox.setAttribute('aria-pressed', String(kind === 'box'));
      drawNow();
    };
    listen(segBars, 'click', () => setChart('bars'));
    listen(segBox, 'click', () => setChart('box'));

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => drawNow()) : null;
    ro?.observe(canvasWrap);
    listen(window, 'themechange', drawNow);
    if (!ro) listen(window, 'resize', drawNow);

    this._api = {
      relabel() {
        // Els textos amb data-i18n els refresca main.js; refresquem els dinàmics.
        i18n.apply(root);
        tbody.querySelectorAll('tr').forEach((tr, i) => {
          const [ix, inn] = tr.querySelectorAll('input');
          ix.setAttribute('aria-label', t('stats.valueOf', { n: i + 1 }));
          inn.setAttribute('aria-label', t('stats.freqOf', { n: i + 1 }));
          tr.querySelector('.st-del').setAttribute('aria-label', t('stats.delRow', { n: i + 1 }));
        });
        renderComputed();
      },
      destroy() {
        cleanups.forEach((fn) => fn());
        cleanups.length = 0;
        ro?.disconnect();
        if (dlg.open) closeDlg();
      },
    };

    i18n.apply(root);
    renderTable();
  },

  onLanguageChange() {
    this._api?.relabel();
  },

  unmount() {
    this._api?.destroy();
    this._api = null;
  },
};
