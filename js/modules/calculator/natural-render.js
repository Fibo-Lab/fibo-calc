// Dibuix de l'expressió en notació natural (fraccions apilades, arrels, exponents…)
// a partir de l'arbre de natural.js, i conversió d'un toc a posició del cursor.
// Tot es construeix amb nodes DOM (mai innerHTML amb text de l'usuari).

import { layout, linearText } from './natural.js';

const SVG = 'http://www.w3.org/2000/svg';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Element de token: data-i per als tocs; si és l'àncora, el cursor k=i+1 va just després.
function tokEl(ctx, cls, text, i, anchor = true) {
  const node = el('span', cls, text);
  node.dataset.i = String(i);
  if (anchor) ctx.anchors.set(i, node);
  return node;
}

// Àncora invisible (amplada zero) d'un token que no es veu: '/', '^', '(' i ')' amagats…
const zero = (ctx, i) => tokEl(ctx, 'nat-z', '', i);

// Signe que s'estira amb el contingut (arrel o parèntesi), dibuixat en SVG.
function stretchy(kind, cls) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('viewBox', kind === 'root' ? '0 0 10 20' : '0 0 6 20');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  const d = {
    root: 'M0.5 12 L2.6 10.8 L5.4 19.2 L9.6 0.6 L10 0.6',
    open: 'M5 0.8 Q0.6 10 5 19.2',
    close: 'M1 0.8 Q5.4 10 1 19.2',
  }[kind];
  path.setAttribute('d', d);
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.append(path);
  return svg;
}

// Hi ha alguna fracció a dins? (aleshores els parèntesis visibles s'estiren)
function isTall(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'frac') return true;
  return Object.values(node).some((v) => v && typeof v === 'object' && isTall(v));
}

// Caixa (span) amb el contingut d'una seqüència; `lead` és l'àncora d'obertura.
function box(ctx, cls, seqNode, lead) {
  const node = el('span', cls);
  if (lead) node.append(lead);
  renderInto(ctx, node, seqNode);
  return node;
}

function renderInto(ctx, parent, node) {
  switch (node.type) {
    case 'seq':
      for (const child of node.children) renderInto(ctx, parent, child);
      return;
    case 'tok':
      parent.append(tokEl(ctx, node.text === '' ? 'nat-z' : `nat-k-${node.kind}`, node.text, node.i));
      return;
    case 'placeholder': {
      const p = el('span', 'nat-ph');
      p.dataset.caret = String(node.caret);
      if (!ctx.phs.has(node.caret)) ctx.phs.set(node.caret, p);
      parent.append(p);
      return;
    }
    case 'frac': {
      const f = el('span', 'nat-frac');
      f.append(box(ctx, 'nat-num', node.num), box(ctx, 'nat-den', node.den, zero(ctx, node.i)));
      parent.append(f);
      if (node.close !== null) parent.append(zero(ctx, node.close));
      return;
    }
    case 'sup':
    case 'pow': {
      // Base alta (amb fracció): l'exponent s'arrenglera amb la part de dalt de la base.
      const s = el('span', node.type === 'sup' && isTall(node.base) ? 'nat-sup is-tall' : 'nat-sup');
      if (node.type === 'sup') s.append(box(ctx, 'nat-base', node.base));
      else s.append(tokEl(ctx, 'nat-base nat-powbase', node.base, node.i, false));
      s.append(box(ctx, isTall(node.exp) ? 'nat-exp is-tall' : 'nat-exp', node.exp, zero(ctx, node.i)));
      parent.append(s);
      if (node.close !== null) parent.append(zero(ctx, node.close));
      return;
    }
    case 'root': {
      const r = el('span', node.index ? 'nat-root has-index' : 'nat-root');
      const sign = tokEl(ctx, 'nat-root-sign', undefined, node.i, false);
      sign.append(stretchy('root', 'nat-svg'));
      if (node.index) sign.append(el('span', 'nat-root-index', node.index));
      r.append(sign, box(ctx, 'nat-rad', node.body, zero(ctx, node.i)));
      parent.append(r);
      if (node.close !== null) parent.append(zero(ctx, node.close));
      return;
    }
    case 'abs': {
      const a = el('span', 'nat-abs');
      a.append(tokEl(ctx, 'nat-bar', undefined, node.i, false));
      a.append(box(ctx, 'nat-absbody', node.body, zero(ctx, node.i)));
      a.append(node.close !== null ? tokEl(ctx, 'nat-bar', undefined, node.close) : el('span', 'nat-bar nat-ghost'));
      parent.append(a);
      return;
    }
    case 'fn':
    case 'group': {
      if (node.type === 'group' && node.hidden) {
        parent.append(zero(ctx, node.open));
        renderInto(ctx, parent, node.body);
        if (node.close !== null) parent.append(zero(ctx, node.close));
        return;
      }
      const tall = isTall(node.body);
      const g = el('span', tall ? 'nat-group is-tall' : 'nat-group');
      const openI = node.type === 'fn' ? node.i : node.open;
      const open = tokEl(ctx, 'nat-open', undefined, openI);
      if (node.type === 'fn') open.append(el('span', 'nat-fname', node.name));
      open.append(tall ? stretchy('open', 'nat-svg nat-paren') : el('span', 'nat-paren', '('));
      g.append(open, box(ctx, 'nat-gbody', node.body));
      const close = node.close !== null ? tokEl(ctx, 'nat-close', undefined, node.close) : el('span', 'nat-close nat-ghost');
      close.append(tall ? stretchy('close', 'nat-svg nat-paren') : el('span', 'nat-paren', ')'));
      g.append(close);
      parent.append(g);
      return;
    }
    default:
      throw new Error(`Node desconegut: ${node.type}`);
  }
}

export function renderNatural(container, tokens, caret, { showCaret = true } = {}) {
  const ctx = { anchors: new Map(), phs: new Map() };
  const root = el('span', 'nat');
  renderInto(ctx, root, layout(tokens));

  let caretEl = null;
  if (showCaret) {
    caretEl = el('span', 'caret');
    caretEl.setAttribute('aria-hidden', 'true');
    const k = Math.max(0, Math.min(tokens.length, caret));
    const ph = ctx.phs.get(k);
    const anchor = ctx.anchors.get(k - 1);
    if (ph) { ph.classList.add('is-active'); ph.before(caretEl); }
    else if (k === 0 || !anchor) root.prepend(caretEl);
    else anchor.after(caretEl);
  }

  container.dataset.len = String(tokens.length);
  container.setAttribute('aria-label', linearText(tokens));
  container.replaceChildren(root);
  if (caretEl) scrollToCaret(container, caretEl);
  else container.scrollLeft = container.scrollWidth;
}

// Desplaça horitzontalment el contenidor perquè el cursor es vegi (sense moure la pàgina).
function scrollToCaret(container, caretEl) {
  const c = container.getBoundingClientRect();
  const r = caretEl.getBoundingClientRect();
  const pad = 12;
  if (r.left < c.left + pad) container.scrollLeft -= c.left + pad - r.left;
  else if (r.right > c.right - pad) container.scrollLeft += r.right - (c.right - pad);
}

// Posició del cursor (0..n) corresponent a un toc a (clientX, clientY).
export function caretFromPoint(container, clientX, clientY) {
  const len = Number(container.dataset.len) || 0;
  const clamp = (k) => Math.max(0, Math.min(len, k));
  const side = (node) => {
    const r = node.getBoundingClientRect();
    const i = Number(node.dataset.i);
    return clamp(clientX < r.left + r.width / 2 ? i : i + 1);
  };

  const hit = document.elementFromPoint(clientX, clientY);
  if (hit && container.contains(hit)) {
    const ph = hit.closest('[data-caret]');
    if (ph && container.contains(ph)) return clamp(Number(ph.dataset.caret));
    const t = hit.closest('[data-i]');
    if (t && container.contains(t) && !t.classList.contains('nat-z')) return side(t);
  }

  // Cap element sota el dit: el més proper (les àncores invisibles, només si no n'hi ha d'altres).
  let best = null;
  let bestD = Infinity;
  for (const pass of [false, true]) {
    for (const node of container.querySelectorAll('[data-i], [data-caret]')) {
      if (node.classList.contains('nat-z') !== pass) continue;
      const r = node.getBoundingClientRect();
      if (!pass && r.width === 0) continue;
      const dx = Math.max(r.left - clientX, 0, clientX - r.right);
      const dy = Math.max(r.top - clientY, 0, clientY - r.bottom);
      const d = dx * dx + 4 * dy * dy; // la distància vertical compta més (fraccions)
      if (d < bestD) { bestD = d; best = node; }
    }
    if (best) break;
  }
  if (!best) return len;
  return best.dataset.caret !== undefined ? clamp(Number(best.dataset.caret)) : side(best);
}
