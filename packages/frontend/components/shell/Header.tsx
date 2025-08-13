"use client";
export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-white/5 bg-black/20">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="font-semibold tracking-tight">Poker<span className="gold">Verse</span></div>
        <div className="text-sm text-white/70">Balance: 0.00 • Settings</div>
      </div>
    </header>
  )
}


