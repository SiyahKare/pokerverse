import { z } from 'zod'
import { useTableStore } from '../store/useTableStore'
import { verifyDeck } from '@/lib/fairness/verify'
import { useToastStore } from '@/lib/store/useToastStore'

export const HandStart = z.object({ tableId: z.number(), handId: z.number(), sbPos: z.number(), bbPos: z.number() })
export const Deal = z.object({ holes: z.record(z.string(), z.array(z.string())) })
export const Street = z.object({ street: z.string(), pot: z.number(), board: z.array(z.string()) })
export const RngCommit = z.object({ tableId: z.number(), handId: z.number(), commit: z.string() })
export const RngReveal = z.object({ tableId: z.number(), handId: z.number(), seed: z.string() })
export const ActionRequest = z.object({ validActions: z.array(z.enum(['fold','check','call','raise'])), betBounds: z.object({ min: z.string(), max: z.string(), step: z.string() }) })
export const ActionResultOk = z.object({ ok: z.literal(true) })
export const ActionResultErr = z.object({ ok: z.literal(false), code: z.enum(['RATE_LIMIT','INVALID_BET','TABLE_CLOSED','NOT_YOUR_TURN']) })
export const ActionResult = z.union([ActionResultOk, ActionResultErr])

export function wireEvents(socket: any) {
  const onEvent = (type: string, p: unknown) => {
    if (type==='handStart'){ const v = HandStart.safeParse(p); if (v.success) useTableStore.getState().set({ handId: v.data.handId }) }
    else if (type==='deal'){ const v = Deal.safeParse(p); if (v.success) {/* holes later */} }
    else if (type==='street'){ const v = Street.safeParse(p); if (v.success) useTableStore.getState().set({ pot: BigInt(v.data.pot), board: v.data.board }) }
    else if (type==='rng:commit'){ const v = RngCommit.safeParse(p); if (v.success) useTableStore.getState().set({ commit: v.data.commit, verified: 'pending' as any }) }
    else if (type==='rng:reveal'){ const v = RngReveal.safeParse(p); if (v.success) useTableStore.getState().set({ seed: v.data.seed }) }
    else if (type==='action:request'){ const v = ActionRequest.safeParse(p); if (v.success){ const bb = v.data.betBounds; useTableStore.getState().set({ validActions: v.data.validActions, betBounds: { min: BigInt(bb.min), max: BigInt(bb.max), step: BigInt(bb.step) } }) } }
  }
  socket.on('handStart', (p: unknown)=> onEvent('handStart', p))
  socket.on('deal', (p: unknown)=>{ const v = Deal.safeParse(p); if (!v.success) return; /* holes handled per-seat UI later */ })
  socket.on('street', (p: unknown)=>{ const v = Street.safeParse(p); if (!v.success) return; useTableStore.getState().set({ pot: BigInt(v.data.pot), board: v.data.board }) })
  socket.on('rng:commit', (p: unknown)=>{ const v = RngCommit.safeParse(p); if (!v.success) return; useTableStore.getState().set({ commit: v.data.commit, verified: 'pending' as any }) })
  socket.on('rng:reveal', (p: unknown)=>{ const v = RngReveal.safeParse(p); if (!v.success) return; const commit = useTableStore.getState().commit; useTableStore.getState().set({ seed: v.data.seed }); if (commit){ const res = verifyDeck(v.data.seed, commit); useTableStore.getState().set({ verified: res }); try { useToastStore.getState().push(res==='ok'? 'Fairness verified ✅':'Fairness mismatch ❌') } catch {} } })
  socket.on('action:request', (p: unknown)=>{ const v = ActionRequest.safeParse(p); if (!v.success) return; const bb = v.data.betBounds; useTableStore.getState().set({ validActions: v.data.validActions, betBounds: { min: BigInt(bb.min), max: BigInt(bb.max), step: BigInt(bb.step) } }) })

  if (process.env.NEXT_PUBLIC_E2E === "1" && typeof window !== "undefined") {
    (window as any).__PV_DEV__ = { emit: (type: string, payload: any) => { try { onEvent(type, payload) } catch (e) { console.error(e) } } };
  }
}


