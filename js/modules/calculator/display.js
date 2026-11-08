// Dibuix del resultat (fracció apilada o decimal). L'expressió la dibuixa natural-render.js.
// Tot es construeix amb nodes DOM (mai innerHTML amb text de l'usuari).

import { exactParts, exactToText, decimalToText } from '../../core/format.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function exactNode(ex) {
  const { sign, top, bottom } = exactParts(ex);
  const wrap = el('span', 'exact');
  if (sign) wrap.append(el('span', 'sign', sign));
  if (!bottom) {
    wrap.append(el('span', null, top));
  } else {
    const frac = el('span', 'frac');
    frac.append(el('span', 'num', top), el('span', 'den', bottom));
    wrap.append(frac);
  }
  return wrap;
}

export function decimalNode(parts) {
  const wrap = el('span', 'decimal', parts.mantissa);
  if (parts.exp) {
    wrap.append(el('span', 'times', '×10'), el('sup', null, parts.exp));
  }
  return wrap;
}

export function renderResult(container, result, { mode, final, t }) {
  container.classList.toggle('is-final', !!final);
  container.classList.remove('is-error');
  container.removeAttribute('title');

  if (!result || result.empty) {
    container.replaceChildren();
    return;
  }
  if (!result.ok) {
    if (final) {
      container.classList.add('is-error');
      container.replaceChildren(el('span', 'res-main', t(result.error.key, result.error.params)));
    } else {
      container.replaceChildren();
    }
    return;
  }

  const main = el('div', 'res-main');
  const alt = el('div', 'res-alt');
  let label;
  if (result.type === 'other') {
    main.textContent = label = result.text;
  } else {
    const ex = result.exact;
    const showExact = mode === 'exact' && ex;
    label = showExact ? exactToText(ex) : decimalToText(result.decimal);
    main.append(showExact ? exactNode(ex) : decimalNode(result.decimal));
    const exactIsPlain = ex && ex.kind === 'rational' && String(ex.d) === '1';
    if (ex && !exactIsPlain) {
      alt.append(showExact ? '≈ ' : '= ', showExact ? decimalNode(result.decimal) : exactNode(ex));
    } else if (mode === 'exact' && !ex && final) {
      container.title = t('display.approx');
    }
  }
  // Els lectors de pantalla llegeixen només el resultat final, en forma de text ("7/12").
  main.setAttribute('aria-hidden', 'true');
  alt.setAttribute('aria-hidden', 'true');
  const spoken = el('span', 'sr-only', final ? `${t('display.result')}: ${label}` : '');
  container.replaceChildren(spoken, main, alt);
  fitText(main);
}

// Redueix la mida de la lletra fins que el resultat hi cap.
function fitText(node) {
  node.style.fontSize = '';
  const max = parseFloat(getComputedStyle(node).fontSize);
  let size = max;
  while (node.scrollWidth > node.clientWidth && size > max * 0.45) {
    size -= 2;
    node.style.fontSize = size + 'px';
  }
}
