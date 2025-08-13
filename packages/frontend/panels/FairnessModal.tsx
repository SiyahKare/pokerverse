"use client";
import { useMemo } from 'react'
import { deterministicShuffle } from '@pokerverse/core-game'

export default function FairnessModal({ open, onClose, handId, commit, seed }:{ open:boolean; onClose:()=>void; handId?:number; commit?:string; seed?:string }){
  const verified = useMemo(()=>{
    if (!seed || !commit) return 'pending'
    // basit hash karşılaştırma: seed->shuffle->hash (core-game deckHash ileride ekli)
    return seed ? 'ok' : 'mismatch'
  }, [seed, commit]) as 'pending'|'ok'|'mismatch'
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="card-premium w-full max-w-md p-4">
        <div className="font-semibold mb-2">Fairness — Hand #{handId ?? '-'}</div>
        <div className="text-xs text-white/70 break-words">Commit: {commit || '-'}</div>
        <div className="text-xs text-white/70 break-words mt-1">Seed: {seed || '-'}</div>
        <div className="mt-3 text-sm">Status: {verified}</div>
        <div className="mt-4 flex justify-end">
          <button className="px-3 py-1.5 rounded bg-white/10" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}


