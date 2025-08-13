import { Assets } from "pixi.js";
export function registerAtlas() {
  const CDN = (import.meta as any).env?.VITE_ATLAS_CDN ? String((import.meta as any).env.VITE_ATLAS_CDN).replace(/\/$/, '') : ''
  const base = CDN || '/cdn/atlas'
  Assets.addBundle('atlas-1x', {
    'table-felt@1x': `${base}/table-felt@1x.webp`,
    'hand-badge-pending@1x': `${base}/hand-badge-pending@1x.webp`,
    'hand-badge-ok@1x': `${base}/hand-badge-ok@1x.webp`,
    'hand-badge-fail@1x': `${base}/hand-badge-fail@1x.webp`
  });
  // 2x bundle dışı (CDN üzerinden yüklenecek)
}


