// Avisos breus a la part inferior de la pantalla, amb un botó d'acció opcional.

export function createToast(container) {
  let timer = null;

  return function toast(message, { action, timeout = 2500 } = {}) {
    clearTimeout(timer);
    const box = document.createElement('div');
    box.className = 'toast';
    box.setAttribute('role', 'status');
    const text = document.createElement('span');
    text.textContent = message;
    box.append(text);
    if (action) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        container.replaceChildren();
        action.onClick();
      });
      box.append(btn);
    }
    container.replaceChildren(box);
    if (timeout) timer = setTimeout(() => container.replaceChildren(), timeout);
  };
}
