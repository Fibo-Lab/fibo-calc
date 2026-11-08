// Format de nombres per a l'estadística: coma decimal, màx. 4 decimals, sense zeros sobrants.
export function fmt(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '–';
  const r = Number(v.toFixed(4));
  return String(Object.is(r, -0) ? 0 : r).replace('.', ',');
}
