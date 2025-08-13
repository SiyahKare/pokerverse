import { create } from 'zustand'

export type LobbyTable = {
  id: number
  sb: number
  bb: number
  maxPlayers: number
  players: number
  status: 'waiting'|'playing'
}

type Filters = { sbMin?: number; sbMax?: number; maxPlayers?: number; status?: LobbyTable['status'] }

type LobbyState = {
  tables: LobbyTable[]
  filters: Filters
  setFilters: (f: Partial<Filters>) => void
  setTables: (t: LobbyTable[]) => void
}

export const useLobbyStore = create<LobbyState>((set)=>({
  tables: [],
  filters: {},
  setFilters: (f)=> set((s)=>({ filters: { ...s.filters, ...f } })),
  setTables: (t)=> set({ tables: t }),
}))


