// Temes predefinits. Un tema és NOMÉS DADES: no conté codi ni selectors CSS.
//
//   {
//     id, name: { ca, es },       // nom visible
//     extends: 'light',            // hereta tots els tokens que no redefineix
//     scheme: 'light' | 'dark',    // color-scheme del navegador (formularis, barres de desplaçament)
//     tokens: { color, shape, depth, type, motion },  // cada clau es converteix en --clau
//     fx: ['glow', ...],           // efectes que no són variables (vegeu [data-fx] a app.css)
//   }
//
// "base" té TOTS els tokens; els altres temes l'estenen directament o indirectament,
// i així sempre surten complets. Un tema d'usuari futur tindrà exactament aquesta forma
// (p. ex. { id:'meu', extends:'dark', tokens:{ color:{ accent:'#f80' } } }).

export const base = {
  id: 'base',
  scheme: 'light',
  tokens: {
    color: {
      bg: '#F4F6FA',
      surface: '#FFFFFF',
      screen: '#E9EEF5',
      'screen-ink': '#17202B',
      ink: '#17202B',
      muted: '#5A6878',
      line: '#CDD6E1',
      key: '#FFFFFF',
      'key-num': '#FFFFFF',
      'key-fn': '#E3E9F1',
      'key-op': '#D9E6F7',
      'key-del': '#F6DFD6',
      'key-eq': '#0B63B6',
      'on-eq': '#FFFFFF',
      'key-ink': '#17202B',
      accent: '#0B63B6',
      'accent-ink': '#FFFFFF',
      alt: '#B04A00',
      error: '#B3261E',
      focus: '#7A3E9D',
      'chart-1': '#0B63B6',
      'chart-2': '#C2570B',
      'chart-3': '#2E7D32',
    },
    shape: {
      'key-radius': '14px',
      'panel-radius': '18px',
      'chip-radius': '999px',
      'key-gap': '7px',
    },
    depth: {
      'key-shadow': '0 1px 0 rgb(23 32 43 / .12), 0 1px 3px rgb(23 32 43 / .06)',
      'key-shadow-active': 'none',
      'key-border': '1px solid transparent',
      'panel-shadow': 'none',
      'screen-border': '1px solid transparent',
    },
    type: {
      font: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      mono: 'ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", monospace',
      'display-font': 'var(--mono)',
      'display-weight': '500',
      'display-scale': '1',
      'key-weight': '500',
    },
    motion: {
      dur: '160ms',
      'press-scale': '.96',
    },
  },
  fx: [],
};

export const light = {
  id: 'light',
  extends: 'base',
  name: { ca: 'Clar', es: 'Claro' },
  tokens: {},
};

export const dark = {
  id: 'dark',
  extends: 'base',
  name: { ca: 'Fosc', es: 'Oscuro' },
  scheme: 'dark',
  tokens: {
    color: {
      bg: '#11161D',
      surface: '#18202A',
      screen: '#1E2833',
      'screen-ink': '#E8EEF5',
      ink: '#E8EEF5',
      muted: '#9AA9BA',
      line: '#2F3C4B',
      key: '#222C38',
      'key-num': '#2A3542',
      'key-fn': '#1F2832',
      'key-op': '#22364D',
      'key-del': '#4A2B24',
      'key-eq': '#4FA3F0',
      'on-eq': '#0A1622',
      'key-ink': '#E8EEF5',
      accent: '#6CB4F5',
      'accent-ink': '#0A1622',
      alt: '#FFB061',
      error: '#FF8A80',
      focus: '#D2A8F0',
      'chart-1': '#6CB4F5',
      'chart-2': '#FFB061',
      'chart-3': '#7BD88F',
    },
    depth: {
      'key-shadow': '0 1px 0 rgb(0 0 0 / .5)',
    },
  },
};

// Alt contrast i xifres grans: pensat per projectar a classe.
export const projector = {
  id: 'projector',
  extends: 'light',
  name: { ca: 'Projector', es: 'Proyector' },
  tokens: {
    color: {
      bg: '#FFFFFF',
      surface: '#FFFFFF',
      screen: '#FFFFFF',
      'screen-ink': '#000000',
      ink: '#000000',
      muted: '#333333',
      line: '#000000',
      key: '#FFFFFF',
      'key-num': '#FFFFFF',
      'key-fn': '#EDEDED',
      'key-op': '#FFD54A',
      'key-del': '#FFC2C2',
      'key-eq': '#000000',
      'on-eq': '#FFFFFF',
      'key-ink': '#000000',
      accent: '#0039A6',
      'accent-ink': '#FFFFFF',
      alt: '#8A3300',
      error: '#A00000',
      focus: '#0039A6',
      'chart-1': '#0039A6',
      'chart-2': '#C24A00',
      'chart-3': '#000000',
    },
    shape: { 'key-radius': '10px', 'panel-radius': '12px' },
    depth: {
      'key-shadow': 'none',
      'key-border': '2px solid #000000',
      'screen-border': '3px solid #000000',
    },
    type: { 'display-weight': '700', 'display-scale': '1.3', 'key-weight': '700' },
  },
};

export const cyberpunk = {
  id: 'cyberpunk',
  extends: 'dark',
  name: { ca: 'Ciberpunk', es: 'Cyberpunk' },
  tokens: {
    color: {
      bg: '#07020F',
      surface: '#120624',
      screen: '#05010B',
      'screen-ink': '#00F0FF',
      ink: '#ECE8FF',
      muted: '#A496E0',
      line: '#3B2266',
      key: '#140A2A',
      'key-num': '#170C30',
      'key-fn': '#1C0E3A',
      'key-op': '#29104F',
      'key-del': '#3D0B2E',
      'key-eq': '#FF2BD6',
      'on-eq': '#0A0010',
      'key-ink': '#ECE8FF',
      accent: '#00F0FF',
      'accent-ink': '#05010B',
      alt: '#FFE600',
      error: '#FF5C7A',
      focus: '#FFE600',
      'chart-1': '#00F0FF',
      'chart-2': '#FF2BD6',
      'chart-3': '#FFE600',
    },
    shape: { 'key-radius': '3px', 'panel-radius': '4px', 'chip-radius': '3px' },
    depth: {
      'key-border': '1px solid rgb(0 240 255 / .35)',
      'key-shadow': '0 0 10px rgb(0 240 255 / .16), inset 0 0 12px rgb(0 240 255 / .06)',
      'key-shadow-active': '0 0 18px rgb(255 43 214 / .6)',
      'panel-shadow': '0 0 24px rgb(0 240 255 / .14)',
      'screen-border': '1px solid rgb(0 240 255 / .55)',
    },
    type: { font: 'var(--mono)', 'key-weight': '600' },
    motion: { dur: '120ms' },
  },
  fx: ['glow', 'scanlines'],
};

export const zen = {
  id: 'zen',
  extends: 'light',
  name: { ca: 'Zen', es: 'Zen' },
  tokens: {
    color: {
      bg: '#F5F3EE',
      surface: '#FBFAF7',
      screen: '#F5F3EE',
      'screen-ink': '#2B2A27',
      ink: '#2B2A27',
      muted: '#6F6B62',
      line: '#E2DED5',
      key: '#F5F3EE',
      'key-num': '#EFECE5',
      'key-fn': '#E9E5DC',
      'key-op': '#E3DED2',
      'key-del': '#EEDFD7',
      'key-eq': '#4F634E',
      'on-eq': '#FFFFFF',
      'key-ink': '#2B2A27',
      accent: '#4F634E',
      'accent-ink': '#FFFFFF',
      alt: '#8A5A2E',
      error: '#A33B2B',
      focus: '#4F634E',
      'chart-1': '#5E735D',
      'chart-2': '#B08968',
      'chart-3': '#7D89A3',
    },
    shape: { 'key-radius': '999px', 'panel-radius': '28px', 'key-gap': '10px' },
    depth: { 'key-shadow': 'none' },
    type: { font: 'system-ui, sans-serif', 'display-font': 'system-ui, sans-serif', 'display-weight': '300', 'key-weight': '400' },
    motion: { dur: '260ms', 'press-scale': '.98' },
  },
  fx: ['quiet'],
};

export const PRESETS = { base, light, dark, projector, cyberpunk, zen };

// Ordre al selector. "auto" no és un tema: és un mode que tria light o dark segons el sistema.
export const PICKER_ORDER = ['auto', 'light', 'dark', 'projector', 'cyberpunk', 'zen'];
