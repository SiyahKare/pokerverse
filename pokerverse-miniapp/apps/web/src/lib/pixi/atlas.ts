import { Assets, Texture } from "pixi.js";
let loaded = false;
let q: '1x' | '2x' = '1x';
const CDN = (import.meta as any).env?.VITE_ATLAS_CDN ? String((import.meta as any).env.VITE_ATLAS_CDN).replace(/\/$/, '') : ''

export async function ensureAtlasLoaded(opts?: { quality?: 'auto'|'low' }) {
  if (loaded) return;
  const dpr = (globalThis as any).devicePixelRatio ?? 1;
  q = (opts?.quality === 'low') ? '1x' : (opts?.quality === 'auto' ? (dpr > 1.5 ? '2x' : '1x') : '1x');
  await Assets.init({ preferences: { resolution: Math.min(dpr, 2) }});
  if (q === '1x') {
    await Assets.loadBundle('atlas-1x');
  } else {
    const base = CDN || '/cdn/atlas';
    // dynamic register 2x from CDN
    Assets.addBundle('atlas-2x', {
      'table-felt@2x': `${base}/table-felt@2x.webp`,
      'pot-glow@2x': `${base}/pot-glow@2x.webp`,
      'seat-gold-border@2x': `${base}/seat-gold-border@2x.webp`,
      'hand-badge-pending@2x': `${base}/hand-badge-pending@2x.webp`,
      'hand-badge-ok@2x': `${base}/hand-badge-ok@2x.webp`,
      'hand-badge-fail@2x': `${base}/hand-badge-fail@2x.webp`
    });
    await Assets.loadBundle('atlas-2x');
  }
  loaded = true;
}
export function getTexture(name: string, silent=false): Texture | null {
  const tex = Texture.from(`${name}@${q}`);
  if (!tex.baseTexture.valid && !silent) console.warn("texture missing:", name);
  return tex.baseTexture.valid ? tex : null;
}


