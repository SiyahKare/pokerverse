import { Assets, Texture } from "pixi.js";
let loaded = false;
let q: '1x' | '2x' = '1x';

export async function ensureAtlasLoaded(opts?: { quality?: 'auto'|'low' }) {
  if (loaded) return;
  const dpr = (globalThis as any).devicePixelRatio ?? 1;
  q = (opts?.quality === 'low') ? '1x' : (opts?.quality === 'auto' ? (dpr > 1.5 ? '2x' : '1x') : '1x');
  await Assets.init({ preferences: { resolution: Math.min(dpr, 2) }});
  await Assets.loadBundle(`atlas-${q}`);
  loaded = true;
}
export function getTexture(name: string, silent=false): Texture | null {
  const tex = Texture.from(`${name}@${q}`);
  if (!tex.baseTexture.valid && !silent) console.warn("texture missing:", name);
  return tex.baseTexture.valid ? tex : null;
}


