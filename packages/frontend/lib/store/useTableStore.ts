import { create } from 'zustand'

type TableState = {
  tableId?: number
  handId?: number
  pot?: bigint
  board: string[]
  seats: { seat: number; addr?: string; stack?: bigint }[]
  status: 'idle'|'playing'|'ended'
  // fairness
  commit?: string
  seed?: string
  verified?: 'pending'|'ok'|'mismatch'
  // action helpers
  validActions?: Array<'fold'|'check'|'call'|'raise'>
  betBounds?: { min: bigint; max: bigint; step: bigint }
  actions?: { requestAt: number | null; lastServerAckAt: number | null }
  // action inflight/error
  inflight?: boolean
  lastError?: string | null
  sendAction?: (kind: 'fold'|'check'|'call'|'raise', amount?: bigint) => void
  set: (p: Partial<TableState>) => void
}

export const useTableStore = create<TableState>((set)=>({
  tableId: undefined,
  handId: undefined,
  pot: 0n,
  board: [],
  seats: [],
  status: 'idle',
  commit: undefined,
  seed: undefined,
  verified: undefined,
  validActions: ['fold','check','call','raise'],
  betBounds: { min: 0n, max: 0n, step: 1n },
  actions: { requestAt: null, lastServerAckAt: null },
  sendAction: (kind, amount)=>{
    set({ inflight: true, actions: { ...(useTableStore.getState().actions||{requestAt:null,lastServerAckAt:null}), requestAt: Date.now() }})
    // TODO: socket emit burada bağlanacak
    setTimeout(()=>{ set({ inflight: false, actions: { ...(useTableStore.getState().actions||{requestAt:null,lastServerAckAt:null}), lastServerAckAt: Date.now() }}) }, 120)
  },
  set: (p)=>set(p)
}))


