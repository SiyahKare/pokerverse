"use client";
import type { LobbyTable } from "@/lib/store/useLobbyStore";

export default function TableCard({ t }: { t: LobbyTable }) {
  const fill = Math.round((t.players / t.maxPlayers) * 100)
  return (
    <div className="card-premium p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Masa #{t.id}</div>
        <div className="text-xs text-white/60">{t.status === 'waiting' ? 'Bekliyor' : 'Oynanıyor'}</div>
      </div>
      <div className="mt-2 text-sm text-white/80">Blind: {t.sb}/{t.bb}</div>
      <div className="mt-1 text-xs text-white/60">Koltuk: {t.players}/{t.maxPlayers}</div>
      <div className="mt-3 h-1.5 bg-white/10 rounded">
        <div className="h-full bg-[var(--gold)] rounded" style={{ width: `${fill}%` }} />
      </div>
      <a href={`/tables/${t.id}`} className="mt-4 inline-flex items-center justify-center px-3 py-2 rounded-md vice-table-link text-sm font-semibold w-full">Masayı aç</a>
    </div>
  )
}


