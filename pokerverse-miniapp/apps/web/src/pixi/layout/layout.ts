export const REF_W = 1920;
export const REF_H = 1080;

const NINE_MAX_NORMALIZED = [
  { x: 0.50, y: 0.16 }, { x: 0.72, y: 0.22 }, { x: 0.85, y: 0.36 },
  { x: 0.86, y: 0.56 }, { x: 0.73, y: 0.72 }, { x: 0.27, y: 0.72 },
  { x: 0.14, y: 0.56 }, { x: 0.15, y: 0.36 }, { x: 0.28, y: 0.22 },
];

const SIX_MAX_NORMALIZED = [
  { x: 0.50, y: 0.18 }, { x: 0.76, y: 0.32 }, { x: 0.80, y: 0.62 },
  { x: 0.50, y: 0.76 }, { x: 0.20, y: 0.62 }, { x: 0.24, y: 0.32 },
];

export function getSeatPositions(max: 6|9, refW = REF_W, refH = REF_H) {
  const norm = max === 6 ? SIX_MAX_NORMALIZED : NINE_MAX_NORMALIZED;
  return norm.map(({x, y}) => ({ x: Math.round(x*refW), y: Math.round(y*refH) }));
}
export function getPotPosition(refW = REF_W, refH = REF_H) {
  return { x: Math.round(0.50*refW), y: Math.round(0.44*refH) };
}
export function getBoardSlots(count: number, refW = REF_W, refH = REF_H) {
  const w = 110, h = 160, gap = 20;
  const cx = Math.round(0.50 * refW), cy = Math.round(0.50 * refH);
  const total = count * w + (count - 1) * gap;
  const x0 = cx - Math.round(total / 2);
  return Array.from({ length: count }, (_, i) => ({ x: x0 + i * (w + gap), y: cy, w, h }));
}


