// Construeix el teclat en pantalla a partir de les definicions de keys.js.
// La segona funció de cada tecla es veu sempre petita a sobre; amb "2a" activa es destaca.

export function createKeypad(container, groups, { onKey, t }) {
  const buttons = [];

  for (const { keys, cls } of groups) {
    const grid = document.createElement('div');
    grid.className = `keys ${cls}`;
    for (const key of keys) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `key ${key.cls || ''}`.trim();
      btn.dataset.id = key.id;
      if (key.shift) {
        const alt = document.createElement('span');
        alt.className = 'alt';
        alt.textContent = key.shift.label;
        btn.append(alt);
      }
      const main = document.createElement('span');
      main.className = 'main';
      btn.append(main);
      btn.addEventListener('click', (e) => {
        onKey(key);
        // Amb ratolí o dit, treu el focus perquè Enter del teclat físic sigui sempre "=".
        if (e.detail) btn.blur();
      });
      buttons.push({ btn, key, main });
      grid.append(btn);
    }
    container.append(grid);
  }

  function relabel() {
    for (const { btn, key, main } of buttons) {
      main.textContent = key.labelKey ? t(key.labelKey) : key.label;
      const name = key.aria ? t(key.aria) : null;
      if (name) btn.setAttribute('aria-label', key.shift ? `${name} (${key.shift.label})` : name);
      else if (key.shift) btn.setAttribute('aria-label', `${key.label} (${key.shift.label})`);
    }
  }

  function setShift(on) {
    container.classList.toggle('is-shift', on);
    const shiftBtn = buttons.find((b) => b.key.action === 'shift');
    if (shiftBtn) shiftBtn.btn.setAttribute('aria-pressed', String(on));
  }

  relabel();
  return { relabel, setShift };
}
