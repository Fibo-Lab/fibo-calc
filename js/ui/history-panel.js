// Panell d'historial (compartit per tots els mòduls).
// En pantalles estretes és un full lliscant; en pantalles amples, una columna fixa.

export function createHistoryPanel(panel, { history, store, i18n, onPick }) {
  const t = i18n.t;
  const list = panel.querySelector('.history-list');
  const empty = panel.querySelector('.history-empty');
  const backdrop = document.querySelector('.backdrop');
  const openBtn = document.querySelector('[data-action="history-open"]');
  const narrow = window.matchMedia('(max-width: 879px)');

  function resultText(item) {
    return store.get().resultMode === 'exact' && item.exactText ? item.exactText : item.decimalText;
  }

  function render() {
    const items = history.list();
    empty.hidden = items.length > 0;
    panel.querySelector('[data-action="history-clear"]').disabled = !items.length;
    list.replaceChildren(...items.map((item) => {
      const li = document.createElement('li');
      li.className = 'h-item';

      const expr = document.createElement('button');
      expr.type = 'button';
      expr.className = 'h-expr';
      expr.textContent = item.exprText;
      expr.title = t('history.useExpr');
      expr.addEventListener('click', () => pick(item, 'expr'));

      const res = document.createElement('button');
      res.type = 'button';
      res.className = 'h-res';
      res.textContent = '= ' + resultText(item);
      res.title = t('history.useResult');
      res.addEventListener('click', () => pick(item, 'result'));

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'h-del';
      del.textContent = '×';
      del.setAttribute('aria-label', t('history.delete'));
      del.addEventListener('click', () => history.remove(item.id));

      li.append(expr, res, del);
      return li;
    }));
  }

  function pick(item, what) {
    onPick(item, what);
    if (narrow.matches) close();
  }

  function open() {
    panel.classList.add('open');
    backdrop.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    panel.querySelector('[data-action="history-close"]').focus();
  }

  function close() {
    if (!panel.classList.contains('open')) return;
    panel.classList.remove('open');
    backdrop.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.focus();
  }

  openBtn.addEventListener('click', () => (panel.classList.contains('open') ? close() : open()));
  panel.querySelector('[data-action="history-close"]').addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      e.stopImmediatePropagation();
      close();
    }
  }, true);
  panel.querySelector('[data-action="history-clear"]').addEventListener('click', () => {
    if (confirm(t('history.clearConfirm'))) history.clear();
  });
  narrow.addEventListener('change', () => close());

  history.subscribe(render);
  store.subscribe((_, changed) => {
    if (changed.includes('resultMode') || changed.includes('lang')) render();
  });
  render();

  return { render, open, close };
}
