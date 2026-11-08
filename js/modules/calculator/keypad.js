// Teclat amb gestos (GestureKeypad).
//
// - Pàgines de funcions lliscants amb scroll-snap natiu + pestanyes visibles.
// - Bloc numèric fix a sota (no es mou mai, per no equivocar-se teclejant de pressa).
// - Pulsació llarga en tecles amb variants: obre un menú; es pot triar arrossegant
//   el dit fins a l'opció i deixant anar, o tocant-la després. També amb clic dret
//   (ratolí) i amb la tecla ↑ quan la tecla té el focus (teclat).

const LONG_PRESS_MS = 420;
const MOVE_TOLERANCE = 10;

function button(cls) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  return b;
}

export function createKeypad(container, { pages, main, onKey, t, labelOf, initialPage = 0, onPageChange }) {
  const buttons = [];
  const tabButtons = [];
  let menu = null;
  let press = null;

  // --- Pestanyes i pàgines ---
  const tabs = document.createElement('div');
  tabs.className = 'fn-tabs';
  tabs.setAttribute('role', 'tablist');
  const scroller = document.createElement('div');
  scroller.className = 'fn-pages';

  pages.forEach((page, i) => {
    const tab = button('fn-tab');
    tab.setAttribute('role', 'tab');
    tab.id = `fn-tab-${page.id}`;
    tab.setAttribute('aria-controls', `fn-page-${page.id}`);
    tab.addEventListener('click', () => goTo(i));
    tabButtons.push({ tab, page });
    tabs.append(tab);

    const grid = document.createElement('div');
    grid.className = 'keys keys-sci fn-page';
    grid.id = `fn-page-${page.id}`;
    grid.setAttribute('role', 'tabpanel');
    grid.setAttribute('aria-labelledby', tab.id);
    for (const key of page.keys) grid.append(makeKey(key));
    scroller.append(grid);
  });

  const mainGrid = document.createElement('div');
  mainGrid.className = 'keys keys-main';
  for (const key of main) mainGrid.append(makeKey(key));
  container.append(tabs, scroller, mainGrid);

  function makeKey(key) {
    const btn = button(`key ${key.cls || ''}`.trim());
    btn.dataset.id = key.id;
    const mainLabel = document.createElement('span');
    mainLabel.className = 'main';
    btn.append(mainLabel);
    if (key.variants?.length) {
      btn.classList.add('has-variants');
      btn.setAttribute('aria-haspopup', 'menu');
    }
    btn.addEventListener('click', (e) => {
      if (btn.dataset.suppress) { delete btn.dataset.suppress; return; }
      closeMenu();
      onKey(key);
      // Amb ratolí o dit, treu el focus perquè Enter del teclat físic sigui sempre "=".
      if (e.detail) btn.blur();
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (key.variants?.length && !menu) openMenu(btn, key);
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && key.variants?.length) {
        e.preventDefault();
        openMenu(btn, key, { focus: true });
      }
    });
    if (key.variants?.length) attachLongPress(btn, key);
    buttons.push({ btn, key, mainLabel });
    return btn;
  }

  // --- Pulsació llarga ---
  function attachLongPress(btn, key) {
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      delete btn.dataset.suppress;
      press = { btn, key, x: e.clientX, y: e.clientY, fired: false, hot: null };
      press.timer = setTimeout(() => {
        press.fired = true;
        btn.dataset.suppress = '1';
        btn.classList.add('is-pressed');
        navigator.vibrate?.(12);
        openMenu(btn, key);
      }, LONG_PRESS_MS);
    });
    btn.addEventListener('pointermove', (e) => {
      if (!press || press.btn !== btn) return;
      if (!press.fired) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_TOLERANCE) cancelPress();
        return;
      }
      // Amb el menú obert, ressalta l'opció que hi ha sota el dit.
      const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('.variant');
      if (press.hot !== hit) {
        press.hot?.classList.remove('is-hot');
        hit?.classList.add('is-hot');
        press.hot = hit;
      }
    });
    const finish = (e) => {
      if (!press || press.btn !== btn) return;
      clearTimeout(press.timer);
      btn.classList.remove('is-pressed');
      if (press.fired && press.hot && e.type === 'pointerup') {
        const v = press.hot.variant;
        closeMenu();
        onKey(v);
      }
      // Si es deixa anar fora de cap opció, el menú es queda obert per tocar-ne una.
      press = null;
    };
    btn.addEventListener('pointerup', finish);
    btn.addEventListener('pointercancel', (e) => { finish(e); });
  }

  function cancelPress() {
    if (!press) return;
    clearTimeout(press.timer);
    press.btn.classList.remove('is-pressed');
    press = null;
  }

  // Mentre el menú està obert i el dit continua avall, impedeix que la pàgina llisqui.
  function onTouchMove(e) {
    if (press?.fired) e.preventDefault();
  }
  document.addEventListener('touchmove', onTouchMove, { passive: false });

  function openMenu(btn, key, { focus = false } = {}) {
    closeMenu();
    menu = document.createElement('div');
    menu.className = 'variants';
    menu.setAttribute('role', 'menu');
    for (const v of key.variants) {
      const item = button('variant');
      item.setAttribute('role', 'menuitem');
      item.textContent = v.label;
      item.variant = v;
      item.addEventListener('click', () => { closeMenu(); onKey(v); btn.focus({ preventScroll: true }); if (!focus) btn.blur(); });
      menu.append(item);
    }
    document.body.append(menu);
    // Posició: centrat a sobre de la tecla, sense sortir de la pantalla.
    const r = btn.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left + r.width / 2 - m.width / 2), window.innerWidth - m.width - 8);
    const top = r.top - m.height - 8 < 8 ? r.bottom + 8 : r.top - m.height - 8;
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.addEventListener('keydown', (e) => {
      const items = [...menu.querySelectorAll('.variant')];
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        items[(i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length].focus();
      } else if (e.key === 'Escape' || e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
        btn.focus();
      }
    });
    if (focus) menu.querySelector('.variant')?.focus();
  }

  function closeMenu() {
    menu?.remove();
    menu = null;
  }

  function onDocPointerDown(e) {
    if (menu && !menu.contains(e.target)) closeMenu();
  }
  document.addEventListener('pointerdown', onDocPointerDown, true);
  window.addEventListener('resize', closeMenu);

  // --- Pàgina activa ---
  let pageIndex = -1;
  function currentIndex() {
    const pagesEls = [...scroller.children];
    let best = 0;
    let dist = Infinity;
    pagesEls.forEach((p, i) => {
      const d = Math.abs(p.offsetLeft - scroller.scrollLeft);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }
  function markPage(i) {
    if (i === pageIndex) return;
    pageIndex = i;
    tabButtons.forEach(({ tab }, j) => {
      tab.setAttribute('aria-selected', String(i === j));
      tab.tabIndex = i === j ? 0 : -1;
    });
    [...scroller.children].forEach((p, j) => p.toggleAttribute('inert', j !== i));
    onPageChange?.(pages[i].id);
  }
  function goTo(i, behavior = 'smooth') {
    const target = scroller.children[i];
    if (!target) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || behavior === 'auto') scroller.scrollLeft = target.offsetLeft;
    else scroller.scrollTo({ left: target.offsetLeft, behavior });
    markPage(i);
  }
  // Calcular la pàgina és barat (3 elements): es fa directament a cada scroll.
  scroller.addEventListener('scroll', () => {
    closeMenu();
    cancelPress();
    markPage(currentIndex());
  }, { passive: true });
  // Respatller: en acabar el gest (i la inèrcia), torna a comprovar la pàgina.
  scroller.addEventListener('scrollend', () => markPage(currentIndex()));
  scroller.addEventListener('touchend', () => setTimeout(() => markPage(currentIndex()), 450), { passive: true });
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = (pageIndex + (e.key === 'ArrowRight' ? 1 : -1) + pages.length) % pages.length;
    goTo(i);
    tabButtons[i].tab.focus();
  });

  function relabel() {
    for (const { tab, page } of tabButtons) tab.textContent = t(page.labelKey);
    for (const { btn, key, mainLabel } of buttons) {
      const custom = labelOf?.(key);
      if (key.icon) mainLabel.innerHTML = key.icon; // SVG estàtic de keys.js, mai text d'usuari
      else mainLabel.textContent = custom ?? (key.labelKey ? t(key.labelKey) : key.label);
      const name = key.aria ? t(key.aria) : (custom ?? key.label);
      const extra = key.variants?.length ? ` (${t('key.more')}: ${key.variants.map((v) => v.label).join(', ')})` : '';
      btn.setAttribute('aria-label', name + extra);
    }
  }

  relabel();
  const start = Math.min(Math.max(0, initialPage), pages.length - 1);
  markPage(start);
  // Espera que el teclat ja estigui al document per poder desplaçar-lo. Es repeteix
  // quan acaba de carregar la pàgina perquè les fonts i el CSS poden recol·locar-lo.
  const restore = () => goTo(pageIndex, 'auto');
  setTimeout(restore, 0);
  if (document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(restore, 50), { once: true });

  return {
    relabel,
    goTo,
    destroy() {
      closeMenu();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      window.removeEventListener('resize', closeMenu);
    },
  };
}
