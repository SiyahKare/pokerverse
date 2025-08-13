import { create } from 'zustand'

type SessionState = {
  userId?: string
  token?: string
  set: (p: Partial<SessionState>) => void
}

export const useSessionStore = create<SessionState>((set)=>({
  userId: undefined,
  token: undefined,
  set: (p)=>set(p),
}))


