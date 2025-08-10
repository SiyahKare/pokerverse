import React, { useEffect, useMemo, useRef, useState } from 'react'

export type BetPanelProps = {
  open: boolean
  min: number; max: number; step: number
  pot: number; call?: number
  initial?: number
  onChange?(v: number): void
  onPreset?(p: '1_3'|'1_2'|'2_3'|'pot'|'allin'): void
  onConfirm(v: number): void
  onClose(): void
  haptic?: (type: 'light'|'medium'|'rigid'|'success'|'warning') => void
}

export default function BetPanel(props: BetPanelProps) {
  const { open, min, max, step, pot, call, initial, onChange, onPreset, onConfirm, onClose, haptic } = props
  const [val, setVal] = useState<number>(initial ?? Math.max(min, call ?? min))
  useEffect(()=> setVal(initial ?? Math.max(min, call ?? min)), [open])

  const presets = useMemo(() => ([
    { key: '1_3', label: '1/3 Pot', value: Math.max(min, Math.round((pot/3)/step)*step) },
    { key: '1_2', label: '1/2 Pot', value: Math.max(min, Math.round((pot/2)/step)*step) },
    { key: '2_3', label: '2/3 Pot', value: Math.max(min, Math.round((pot*2/3)/step)*step) },
    { key: 'pot', label: 'Pot', value: Math.max(min, Math.round((pot)/step)*step) },
    { key: 'allin', label: 'All-In', value: max },
  ] as const), [min,max,step,pot])

  useEffect(()=> { onChange?.(val) }, [val])
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-[820px] rounded-t-3xl border px-4 pb-5 pt-3" style={{ background: 'var(--tg-sec-bg)', borderColor: 'rgba(255,255,255,0.08)' }} onClick={(e)=> e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-[var(--tg-hint)]">Bet / Raise</div>
          <button className="text-sm underline text-[var(--tg-link)]" onClick={onClose}>Close</button>
        </div>
        <div className="mb-2 text-2xl font-semibold text-[var(--tg-text)]">{val}</div>
        {typeof call === 'number' && <div className="mb-3 text-xs text-[var(--tg-hint)]">Call: {call}</div>}
        <input type="range" min={min} max={max} step={step} value={val} onChange={(e)=> setVal(Number(e.target.value))} onPointerDown={()=> haptic?.('light')} className="w-full" />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {presets.map(p => (
            <button key={p.key} className="h-9 rounded-xl text-xs font-semibold" style={{ background: '#2b3440', color: 'var(--tg-text)' }} onClick={() => { setVal(p.value); onPreset?.(p.key as any); haptic?.('light') }}>
              {p.label}
            </button>
          ))}
        </div>
        <SlideToConfirm className="mt-5" text={`Slide to ${call && val<=call ? 'Call' : 'Confirm'} ${val}`} onConfirm={() => { haptic?.('success'); onConfirm(val) }} onStart={() => haptic?.('light')} onCancel={() => haptic?.('warning')} />
      </div>
    </div>
  )
}

function SlideToConfirm(props: { className?: string; text: string; onStart?(): void; onConfirm(): void; onCancel?(): void; }) {
  const { className, text, onStart, onConfirm, onCancel } = props
  const trackRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const activePointerIdRef = useRef<number | null>(null)

  const updateFromClientX = (clientX: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    setProgress(x / rect.width)
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      if (activePointerIdRef.current != null && e.pointerId !== activePointerIdRef.current) return
      e.preventDefault()
      updateFromClientX(e.clientX)
    }
    const finish = (confirmed: boolean) => {
      setDragging(false)
      activePointerIdRef.current = null
      if (confirmed) {
        setProgress(1)
        onConfirm()
        setTimeout(() => setProgress(0), 200)
      } else {
        onCancel?.()
        setProgress(0)
      }
    }
    const onUp = (e: PointerEvent) => {
      if (!dragging) return
      if (activePointerIdRef.current != null && e.pointerId !== activePointerIdRef.current) return
      e.preventDefault()
      finish(progress > 0.85)
    }
    const onCancelEv = (e: PointerEvent) => {
      if (!dragging) return
      if (activePointerIdRef.current != null && e.pointerId !== activePointerIdRef.current) return
      e.preventDefault()
      finish(false)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp, { passive: false })
    window.addEventListener('pointercancel', onCancelEv, { passive: false })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancelEv)
    }
  }, [dragging, progress, onConfirm, onCancel])

  const progressFillWidth = trackRef.current
    ? `${Math.max(48, progress * trackRef.current.clientWidth)}px`
    : `${progress * 100}%`

  const knobTranslateX = progress * (((trackRef.current?.clientWidth ?? 0)) - 48)

  return (
    <div className={className}>
      <div
        ref={trackRef}
        className="relative h-12 w-full select-none rounded-2xl border touch-none"
        style={{ background: '#1f2937', borderColor: 'rgba(255,255,255,0.08)' }}
        onPointerDown={(e)=> {
          e.preventDefault()
          activePointerIdRef.current = e.pointerId
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          setDragging(true)
          onStart?.()
          updateFromClientX(e.clientX)
        }}
      >
        <div className="absolute inset-y-0 left-0 rounded-2xl" style={{ width: progressFillWidth, background: 'var(--tg-btn)', transition: dragging ? 'none' : 'width 120ms ease' }} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold" style={{ color: 'var(--tg-btn-text)' }}>{text}</span>
        </div>
        <div
          ref={knobRef}
          className="absolute top-1 left-1 h-10 w-10 cursor-pointer touch-none select-none rounded-2xl shadow"
          style={{ transform: `translateX(${knobTranslateX}px)`, background: 'var(--tg-btn)', transition: dragging ? 'none' : 'transform 120ms ease' }}
          onPointerDown={(e) => {
            e.preventDefault()
            activePointerIdRef.current = e.pointerId
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            setDragging(true)
            onStart?.()
            updateFromClientX(e.clientX)
          }}
        />
      </div>
    </div>
  )
}


