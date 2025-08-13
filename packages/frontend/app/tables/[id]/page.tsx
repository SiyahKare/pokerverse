"use client";
import { useParams } from 'next/navigation'
import ConnectionBadge from "@/components/hud/ConnectionBadge"
import TableCanvas from "@/components/table/TableCanvas"
import ActionBar from "@/panels/ActionBar"
import { useEffect, useMemo, useState } from 'react'
import { wireEvents } from '@/lib/ws/events'
import HandBadge from '@/components/hud/HandBadge'
import { useToastStore } from '@/lib/store/useToastStore'

export default function TableRoute() {
  const params = useParams() as { id?: string }
  const id = useMemo(()=> Number(params?.id || 0), [params])
  const [state, setState] = useState<'connected'|'reconnecting'|'offline'>('connected')
  useEffect(()=>{
    if (process.env.NEXT_PUBLIC_E2E === "1") {
      try { wireEvents({ on: () => {} } as any) } catch {}
    }
  }, [])
  return (
    <div className="space-y-4">
      <TableCanvas tableId={id} />
      <HandBadge />
      {/* simple toast rail */}
      <div className="fixed left-2 bottom-24 space-y-2 z-50">
        {useToastStore.getState().items.map((m, i)=>(<div key={i} className="px-3 py-1.5 rounded bg-black/70 text-[--text] text-xs">{m}</div>))}
      </div>
      <div className="h-24" />
      <ConnectionBadge state={state} />
      <ActionBar />
    </div>
  )
}


