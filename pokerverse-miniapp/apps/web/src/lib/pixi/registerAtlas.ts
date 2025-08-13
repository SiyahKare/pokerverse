import { Assets } from "pixi.js";
export function registerAtlas() {
  Assets.addBundle('atlas-1x', {
    'table-felt@1x': '/assets/atlas/table-felt@1x.png',
    'pot-glow@1x': '/assets/atlas/pot-glow@1x.png',
    'seat-gold-border@1x': '/assets/atlas/seat-gold-border@1x.png',
    'hand-badge-pending@1x': '/assets/atlas/hand-badge-pending@1x.png',
    'hand-badge-ok@1x': '/assets/atlas/hand-badge-ok@1x.png',
    'hand-badge-fail@1x': '/assets/atlas/hand-badge-fail@1x.png'
  });
  Assets.addBundle('atlas-2x', {
    'table-felt@2x': '/assets/atlas/table-felt@2x.png',
    'pot-glow@2x': '/assets/atlas/pot-glow@2x.png',
    'seat-gold-border@2x': '/assets/atlas/seat-gold-border@2x.png',
    'hand-badge-pending@2x': '/assets/atlas/hand-badge-pending@2x.png',
    'hand-badge-ok@2x': '/assets/atlas/hand-badge-ok@2x.png',
    'hand-badge-fail@2x': '/assets/atlas/hand-badge-fail@2x.png'
  });
}


