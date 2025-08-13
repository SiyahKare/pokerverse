import { z } from 'zod'
import { useTableStore } from '../store/useTableStore'

export const HandStart = z.object({ tableId: z.number(), handId: z.number(), sbPos: z.number(), bbPos: z.number() })
export const Deal = z.object({ holes: z.record(z.string(), z.array(z.string())) })
export const Street = z.object({ street: z.string(), pot: z.number(), board: z.array(z.string()) })
export const RngCommit = z.object({ tableId: z.number(), handId: z.number(), commit: z.string() })
export const RngReveal = z.object({ tableId: z.number(), handId: z.number(), seed: z.string() })

export function wireEvents(socket: any) {
  socket.on('handStart', (p: unknown)=>{ const v = HandStart.safeParse(p); if (!v.success) return; useTableStore.getState().set({ handId: v.data.handId }) })
  socket.on('deal', (p: unknown)=>{ const v = Deal.safeParse(p); if (!v.success) return; /* holes handled per-seat UI later */ })
  socket.on('street', (p: unknown)=>{ const v = Street.safeParse(p); if (!v.success) return; useTableStore.getState().set({ pot: BigInt(v.data.pot), board: v.data.board }) })
  socket.on('rng:commit', (p: unknown)=>{ const v = RngCommit.safeParse(p); if (!v.success) return; useTableStore.getState().set({ commit: v.data.commit, verified: 'pending' as any }) })
  socket.on('rng:reveal', (p: unknown)=>{ const v = RngReveal.safeParse(p); if (!v.success) return; useTableStore.getState().set({ seed: v.data.seed }) })
}


