// JSX intrinsic kullanım: sprite
import { useTextures } from '../../assets/TextureStore'
import { REF_W, REF_H } from '../layout/layout'

export default function TableBackground() {
  const { table } = useTextures()
  if (!table) return null
  return <sprite texture={table} x={0} y={0} width={REF_W} height={REF_H} />
}


