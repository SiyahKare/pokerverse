import { create } from 'zustand'

type TableState = {
  tableId?: number
  handId?: number
  pot?: bigint
  board: string[]
  seats: { seat: number; addr?: string; stack?: bigint }[]
  status: 'idle'|'playing'|'ended'
  set: (p: Partial<TableState>) => void
}

export const useTableStore = create<TableState>((set)=>({
  tableId: undefined,
  handId: undefined,
  pot: 0n,
  board: [],
  seats: [],
  status: 'idle',
  set: (p)=>set(p)
}))


