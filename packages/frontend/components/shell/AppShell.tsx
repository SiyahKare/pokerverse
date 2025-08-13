"use client";
import Header from "./Header";
import { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4">
        {children}
      </main>
      <div className="h-16" />
    </div>
  )
}


