let installed = false

function stringifyArg(arg: unknown): string {
  try {
    if (typeof arg === 'string') return arg
    if (arg instanceof Error) return arg.message
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

export function silencePixiCacheWarnings() {
  if (installed) return
  installed = true

  const originalWarn = console.warn

  console.warn = function (...args: unknown[]) {
    try {
      const text = args.map(stringifyArg).join(' ')
      // Yalnızca PixiJS Cache duplicate key uyarılarını hedef al
      const isPixiCacheDup = /\bPixiJS\s+Warning\b[\s\S]*\[Cache\][\s\S]*already has key/i.test(text)
      // Pixi Assets.init tekrar çağrıldı uyarısı (StrictMode double effect vb.)
      const isPixiAssetsInit = /\bPixiJS\s+Warning\b[\s\S]*AssetManager already initialized/i.test(text)
      // Telegram WebApp sürüm uyarıları (desteklenmiyor mesajları)
      const isTgVersionNote = /\[Telegram\.WebApp\][\s\S]*(not supported in version)/i.test(text)
      if (isPixiCacheDup || isPixiAssetsInit || isTgVersionNote) return
    } catch {
      // yutma; orijinale düşsün
    }
    return (originalWarn as any).apply(console, args as any)
  }
}


