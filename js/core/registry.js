// Registre de mòduls de l'aplicació (calculadora, i en el futur gràfiques, estadística...).
//
// Un mòdul és un objecte amb aquesta forma:
//   {
//     id: 'stats',                  // identificador únic
//     titleKey: 'module.stats',     // clau de traducció per a la pestanya
//     icon: '<svg>…</svg>',         // icona opcional (SVG en línia)
//     i18n: { ca: {...}, es: {...} },// textos propis (opcional)
//     mount(container, ctx) {},     // dibuixa el mòdul dins de container
//     unmount() {},                 // neteja (listeners, timers...)
//     onLanguageChange() {},        // opcional
//   }
//
// ctx = { math, engine, store, i18n, history, toast }

const modules = [];

export function registerModule(mod) {
  if (!mod || !mod.id || typeof mod.mount !== 'function') {
    throw new Error('Mòdul invàlid: cal id i mount()');
  }
  if (modules.some((m) => m.id === mod.id)) {
    throw new Error(`Mòdul duplicat: ${mod.id}`);
  }
  modules.push(mod);
}

export function getModules() {
  return modules.slice();
}

export function getModule(id) {
  return modules.find((m) => m.id === id);
}
