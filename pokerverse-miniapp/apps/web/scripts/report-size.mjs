import { gzipSync } from 'zlib'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, resolve } from 'path'

function collect(dir) {
  let files = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) files = files.concat(collect(p))
    else files.push(p)
  }
  return files
}

const dir = resolve(process.cwd(), 'dist')
try {
  const list = collect(dir)
  let total = 0
  for (const f of list) {
    // sadece js ve css dosyalarını say
    if (!/\.(js|css)$/i.test(f)) continue
    if (/LICENSE/i.test(f)) continue
    const buf = readFileSync(f)
    total += gzipSync(buf).length
  }
  const kb = (total/1024).toFixed(1)
  console.log(`MiniApp gzip total: ${kb} KB`)
  if (total > 500*1024) console.warn('WARN: exceeds 500KB target')
} catch (e) {
  console.warn('size report skipped:', e.message)
}


