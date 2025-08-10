// Pixi v8 Assets manifest (bundle bazlı)
export const CORE_BUNDLE = 'core'

export const manifest = {
  bundles: [
    {
      name: CORE_BUNDLE,
      assets: {
        'cards@1x': { src: '/assets/atlases/cards@1x.json', data: { resolution: 1 } },
        'cards@2x': { src: '/assets/atlases/cards@2x.json', data: { resolution: 2 } },
        'chips@1x': { src: '/assets/atlases/chips@1x.json', data: { resolution: 1 } },
        'chips@2x': { src: '/assets/atlases/chips@2x.json', data: { resolution: 2 } },
        'table': '/assets/textures/table.webp',
      },
    },
  ],
} as const


