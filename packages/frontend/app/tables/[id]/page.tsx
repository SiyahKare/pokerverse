"use client";
import { useParams } from 'next/navigation'
import ConnectionBadge from "@/components/hud/ConnectionBadge"
import TableCanvas from "@/components/table/TableCanvas"
import { useMemo, useState } from 'react'

export default function TableRoute() {
  const params = useParams() as { id?: string }
  const id = useMemo(()=> Number(params?.id || 0), [params])
  const [state, setState] = useState<'connected'|'reconnecting'|'offline'>('connected')
  return (
    <div className="space-y-4">
      <TableCanvas tableId={id} />
      <div className="h-24" />
      <ConnectionBadge state={state} />
    </div>
  )
}


