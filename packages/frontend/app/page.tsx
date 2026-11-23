"use client";
import { useEffect, useMemo } from 'react'
import LobbyFilters from "@/components/lobby/LobbyFilters"
import TableCard from "@/components/lobby/TableCard"
import { fetchTablesMock } from "@/lib/api/tables"
import { useLobbyStore } from "@/lib/store/useLobbyStore"

export default function LobbyPage() {
  const tables = useLobbyStore(s=>s.tables)
  const setTables = useLobbyStore(s=>s.setTables)
  const filters = useLobbyStore(s=>s.filters)

  useEffect(()=>{ fetchTablesMock().then(setTables) }, [setTables])

  const filtered = useMemo(()=> tables.filter(t=>{
    if (filters.sbMin!==undefined && t.sb < filters.sbMin) return false
    if (filters.sbMax!==undefined && t.sb > filters.sbMax) return false
    if (filters.maxPlayers!==undefined && t.maxPlayers !== filters.maxPlayers) return false
    if (filters.status && t.status !== filters.status) return false
    return true
  }), [tables, filters])

  const stats = useMemo(()=> ({ active: tables.length, players: tables.reduce((a,b)=>a+b.players,0) }), [tables])

  return (
    <div className="space-y-6">
      <section className="vice-hero">
        <div className="vice-kicker">VICE NIGHTS · POKERVERSE</div>
        <h1>Baron’un masası.</h1>
        <p>Miami gecesi başlıyor. Masaları keşfet, stratejini kur ve oyuna katıl.</p>
        <span className="vice-notice">Örnek lobi · Masa verileri demodur</span>
      </section>
      <div className="text-sm text-white/70">Örnek masalar: <span className="gold font-medium">{stats.active}</span> • Örnek oyuncular: <span className="gold font-medium">{stats.players}</span></div>
      <LobbyFilters />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t=> (<TableCard key={t.id} t={t} />))}
      </div>
    </div>
  )
}


