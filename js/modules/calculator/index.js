// Mòdul principal: calculadora científica.

import { Editor } from './editor.js';
import { SCI_KEYS, MAIN_KEYS, continuesPrevious, prettyTokens, textToTokens } from './keys.js';
import { renderExpression, renderResult } from './display.js';
import { createKeypad } from './keypad.js';
import { exactToText, decimalToText } from '../../core/format.js';
import { missingParens } from '../../core/engine.js';

const TEMPLATE = `
  <section class="display" aria-labelledby="calc-expr-label">
    <div class="status">
      <button type="button" class="chip" data-role="angle"></button>
      <button type="button" class="chip" data-role="format"></button>
      <span class="chip chip-shift" data-role="shift-indicator" hidden data-i18n="mode.shift"></span>
    </div>
    <div class="expr-row">
      <button type="button" class="nav-btn" data-role="left" data-i18n-attr="aria-label:display.left">◀</button>
      <div class="expr" data-role="expr" role="textbox" aria-readonly="true" aria-multiline="false"
           id="calc-expr-label" data-i18n-attr="aria-label:display.expression"></div>
      <button type="button" class="nav-btn" data-role="right" data-i18n-attr="aria-label:display.right">▶</button>
    </div>
    <output class="result" data-role="result" aria-live="polite" data-i18n-attr="title:display.copy"></output>
  </section>
  <section class="keypad" data-role="keypad"></section>
`;

export default {
  id: 'calculator',
  titleKey: 'module.calculator',

  mount(container, ctx) {
    const { engine, store, i18n, history, toast } = ctx;
    const t = i18n.t;
    container.innerHTML = TEMPLATE;
    const $ = (role) => container.querySelector(`[data-role="${role}"]`);
    const exprEl = $('expr');
    const resultEl = $('result');
    const angleBtn = $('angle');
    const formatBtn = $('format');
    const shiftInd = $('shift-indicator');

    const editor = new Editor();
    let shift = false;
    let evaluated = false; // s'acaba de prémer "="
    let lastResult = null;
    let ansSrc = '0'; // valor d'Ans en forma de text, per desar expressions autònomes

    // En tornar a obrir l'app, Ans és l'últim resultat de l'historial.
    const lastEntry = history.list().find((h) => h.module === 'calculator');
    if (lastEntry) {
      const restored = engine.evaluate(lastEntry.valueSrc);
      if (restored.ok) { engine.commit(restored); ansSrc = lastEntry.valueSrc; }
    }

    const keypad = createKeypad($('keypad'), [
      { keys: SCI_KEYS, cls: 'keys-sci' },
      { keys: MAIN_KEYS, cls: 'keys-main' },
    ], { onKey: handleKey, t });

    function renderStatus() {
      const { angle, resultMode } = store.get();
      angleBtn.textContent = t(angle === 'deg' ? 'mode.deg' : 'mode.rad');
      angleBtn.setAttribute('aria-label', t('mode.angleLabel', { mode: t(angle === 'deg' ? 'mode.degLong' : 'mode.radLong') }));
      formatBtn.textContent = t(resultMode === 'exact' ? 'mode.exact' : 'mode.decimal');
      formatBtn.setAttribute('aria-label', t('mode.resultLabel', { mode: t(resultMode === 'exact' ? 'mode.exactLong' : 'mode.decimalLong') }));
      shiftInd.hidden = !shift;
      keypad.setShift(shift);
    }

    function render() {
      renderExpression(exprEl, editor, { showCaret: !evaluated });
      const mode = store.get().resultMode;
      if (evaluated) {
        renderResult(resultEl, lastResult, { mode, final: true, t });
      } else {
        // Vista prèvia mentre s'escriu.
        renderResult(resultEl, engine.evaluate(editor.text), { mode, final: false, t });
      }
    }

    const wrap = (src) => (/^[\d.]+$/.test(src) ? src : `(${src})`);

    function equals() {
      if (editor.isEmpty) return;
      const result = engine.evaluate(editor.text);
      lastResult = result;
      evaluated = true;
      if (result.ok) {
        // Ans se substitueix pel seu valor perquè l'entrada de l'historial sigui autònoma.
        const tokens = editor.tokens.flatMap((tok) => (tok === 'Ans' ? [...wrap(ansSrc)] : [tok]));
        tokens.push(...')'.repeat(missingParens(editor.text)));
        const ex = result.exact;
        const entry = history.add({
          module: 'calculator',
          tokens,
          exprText: prettyTokens(tokens),
          exactText: ex ? exactToText(ex) : null,
          decimalText: result.decimal ? decimalToText(result.decimal) : result.text,
          valueSrc: ex && ex.kind === 'rational'
            ? (ex.sign < 0 ? '-' : '') + ex.n + (String(ex.d) === '1' ? '' : '/' + ex.d)
            : result.type === 'number' ? String(result.value) : result.text,
        });
        engine.commit(result);
        ansSrc = entry.valueSrc;
      }
      render();
    }

    function insert(tokens) {
      if (evaluated) {
        const keepGoing = continuesPrevious(tokens[0]) && lastResult && lastResult.ok;
        editor.clear();
        if (keepGoing) editor.insert('Ans');
        evaluated = false;
      }
      editor.insert(...tokens);
    }

    function handleKey(key) {
      const def = shift && key.shift ? key.shift : key;
      if (key.action !== 'shift') shift = false;
      const action = def.action;
      if (action === 'shift') shift = !shift;
      else if (action === 'toggle') toggleFormat();
      else if (action === 'clear') { editor.clear(); evaluated = false; lastResult = null; }
      else if (action === 'del') { evaluated = false; editor.backspace(); }
      else if (action === 'equals') { equals(); renderStatus(); return; }
      else if (def.insert !== undefined) insert([def.insert]);
      renderStatus();
      render();
    }

    function toggleFormat() {
      store.set({ resultMode: store.get().resultMode === 'exact' ? 'decimal' : 'exact' });
    }

    function moveCaret(delta) {
      if (evaluated) { evaluated = false; editor.setCaret(editor.tokens.length); }
      editor.move(delta);
      render();
    }

    angleBtn.addEventListener('click', () => store.set({ angle: store.get().angle === 'deg' ? 'rad' : 'deg' }));
    formatBtn.addEventListener('click', toggleFormat);
    $('left').addEventListener('click', () => moveCaret(-1));
    $('right').addEventListener('click', () => moveCaret(1));

    // Tocar dins l'expressió col·loca el cursor.
    exprEl.addEventListener('click', (e) => {
      const tok = e.target.closest('.tok');
      evaluated = false;
      editor.setCaret(tok ? Number(tok.dataset.i) + 1 : editor.tokens.length);
      render();
    });

    // Tocar el resultat el copia.
    resultEl.addEventListener('click', async () => {
      const text = resultEl.querySelector('.sr-only')?.textContent || '';
      const value = text.slice(text.indexOf(':') + 1).trim();
      if (!value || !navigator.clipboard) return;
      try {
        await navigator.clipboard.writeText(value);
        toast(t('display.copied'));
      } catch { /* sense permís per copiar */ }
    });

    // Teclat físic.
    function onKeydown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest('input, select, textarea, dialog')) return;
      const k = e.key;
      if ((k === 'Enter' || k === ' ') && e.target.closest('button')) return; // activa el botó amb focus
      let handled = true;
      if (k === 'Enter' || k === '=') equals();
      else if (k === 'Backspace') { evaluated = false; editor.backspace(); }
      else if (k === 'Delete' || k === 'Escape') { editor.clear(); evaluated = false; lastResult = null; }
      else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        if (evaluated) { evaluated = false; editor.setCaret(editor.tokens.length); }
        editor.move(k === 'ArrowLeft' ? -1 : 1);
      }
      else if (k === 'Home') { evaluated = false; editor.setCaret(0); }
      else if (k === 'End') { evaluated = false; editor.setCaret(editor.tokens.length); }
      else if (k.length === 1 && /[\w.,;+\-*/^()!%πe ]/.test(k)) insert(textToTokens(k));
      else handled = false;
      if (handled) {
        e.preventDefault();
        render();
      }
    }
    function onPaste(e) {
      if (e.target.closest('input, select, textarea')) return;
      const text = e.clipboardData?.getData('text');
      if (!text) return;
      e.preventDefault();
      insert(textToTokens(text.trim()));
      render();
    }
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('paste', onPaste);

    const unsubscribe = store.subscribe((_, changed) => {
      if (changed.includes('angle') && evaluated && editor.tokens.length) {
        // Recalcula amb la nova unitat d'angle, sense tornar-ho a desar a l'historial.
        lastResult = engine.evaluate(editor.text);
      }
      renderStatus();
      render();
    });

    this._api = {
      relabel() { keypad.relabel(); renderStatus(); render(); },
      pick(entry, what) {
        if (what === 'expr') {
          editor.load(entry.tokens);
          evaluated = false;
        } else {
          insert([...wrap(entry.valueSrc)]);
        }
        render();
      },
      destroy() {
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('paste', onPaste);
        unsubscribe();
      },
    };

    renderStatus();
    render();
  },

  onLanguageChange() {
    this._api?.relabel();
  },

  onHistoryPick(entry, what) {
    this._api?.pick(entry, what);
  },

  unmount() {
    this._api?.destroy();
    this._api = null;
  },
};
