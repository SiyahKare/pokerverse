import React from 'react'

export type ActionBarProps = {
  canCheck: boolean
  callAmount?: number
  canBetOrRaise: boolean
  onFold(): void
  onCheckOrCall(): void
  onBetOrRaise(): void
}

export default function ActionBar(props: ActionBarProps) {
  const { canCheck, callAmount, canBetOrRaise, onFold, onCheckOrCall, onBetOrRaise } = props
  return (
    <div className="fixed left-0 right-0 bottom-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-[820px] px-3 pb-3">
        <div className="grid grid-cols-3 gap-3 rounded-2xl border" style={{ background: 'var(--tg-sec-bg)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <button className="h-12 rounded-xl font-semibold" style={{ background: '#2b3440', color: 'var(--tg-text)' }} onClick={onFold}>Fold</button>
          <button className="h-12 rounded-xl font-semibold" style={{ background: canCheck ? '#2b3440' : '#22314a', color: 'var(--tg-text)' }} onClick={onCheckOrCall}>
            {canCheck ? 'Check' : `Call ${callAmount ?? ''}`}
          </button>
          <button className="h-12 rounded-xl font-semibold" style={{ background: 'var(--tg-btn)', color: 'var(--tg-btn-text)' }} onClick={onBetOrRaise} disabled={!canBetOrRaise}>
            {canCheck ? 'Bet' : 'Raise'}
          </button>
        </div>
      </div>
    </div>
  )
}


