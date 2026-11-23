"use client";
import Link from "next/link";
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-pink-300/20 bg-[#15101e]/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="font-bold tracking-[.14em] text-white" aria-label="PokerVerse ana sayfa">
          <span className="gold">♠</span> POKER<span className="gold">VERSE</span>
        </Link>
        <span className="rounded-full border border-pink-300/30 px-3 py-2 text-xs font-medium tracking-wider text-pink-200">VICE NIGHTS</span>
      </div>
    </header>
  )
}
