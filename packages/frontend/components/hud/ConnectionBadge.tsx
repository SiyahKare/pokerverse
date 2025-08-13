"use client";
import { motion } from 'framer-motion'

export default function ConnectionBadge({ state }: { state: 'connected'|'reconnecting'|'offline' }) {
  const color = state==='connected' ? '#3BB273' : state==='reconnecting' ? '#E0B054' : '#D24B4B'
  return (
    <motion.div initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: color }}>
      {state}
    </motion.div>
  )
}


