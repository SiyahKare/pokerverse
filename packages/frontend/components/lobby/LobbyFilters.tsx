"use client";
import { useLobbyStore } from "@/lib/store/useLobbyStore";

export default function LobbyFilters() {
  const filters = useLobbyStore(s=>s.filters)
  const setFilters = useLobbyStore(s=>s.setFilters)
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <input className="bg-[var(--surface-2)] rounded px-3 py-2 text-sm" placeholder="SB min" type="number" value={filters.sbMin ?? ''} onChange={e=>setFilters({ sbMin: e.target.value? Number(e.target.value): undefined })} />
      <input className="bg-[var(--surface-2)] rounded px-3 py-2 text-sm" placeholder="SB max" type="number" value={filters.sbMax ?? ''} onChange={e=>setFilters({ sbMax: e.target.value? Number(e.target.value): undefined })} />
      <input className="bg-[var(--surface-2)] rounded px-3 py-2 text-sm" placeholder="Max players" type="number" value={filters.maxPlayers ?? ''} onChange={e=>setFilters({ maxPlayers: e.target.value? Number(e.target.value): undefined })} />
      <select className="bg-[var(--surface-2)] rounded px-3 py-2 text-sm" value={filters.status ?? ''} onChange={e=>setFilters({ status: (e.target.value||undefined) as any })}>
        <option value="">All</option>
        <option value="waiting">Waiting</option>
        <option value="playing">Playing</option>
      </select>
    </div>
  )
}


