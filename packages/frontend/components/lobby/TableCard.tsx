"use client";
import { formatChips } from "@/lib/utils/format";
import type { LobbyTable } from "@/lib/store/useLobbyStore";

export default function TableCard({ t }: { t: LobbyTable }) {
  const fill = Math.round((t.players / t.maxPlayers) * 100)
  return (
    <div className="card-premium p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Table #{t.id}</div>
        <div className="text-xs text-white/60">{t.status}</div>
      </div>
      <div className="mt-2 text-sm text-white/80">Blinds: {t.sb}/{t.bb}</div>
      <div className="mt-1 text-xs text-white/60">Max: {t.maxPlayers} • Players: {t.players}</div>
      <div className="mt-3 h-1.5 bg-white/10 rounded">
        <div className="h-full bg-[var(--gold)] rounded" style={{ width: `${fill}%` }} />
      </div>
      <a href={`/tables/${t.id}`} className="mt-4 inline-flex items-center justify-center px-3 py-2 rounded-md bg-[var(--gold)] text-black text-sm font-medium w-full">Join</a>
    </div>
  )
}


