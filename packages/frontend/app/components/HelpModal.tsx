"use client";
import { useState, useEffect } from "react";
import content from "../content/holdem-tr.json";

export default function HelpModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?") setOpen((v) => !v);
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-2xl px-4 py-2 shadow-lg bg-black text-white hover:opacity-90"
        aria-label="Yardım"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white text-black p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6 mb-4">
              <h2 className="text-xl font-semibold">{content.title}</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1 bg-neutral-100 hover:bg-neutral-200"
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm leading-6">
              <p><strong>Akış:</strong> {content.flow.join(" → ")}</p>
              <p><strong>Seçenekler:</strong> {content.actions.join(" • ")}</p>
              <p><strong>Blinds:</strong> {content.blinds}</p>
              <p><strong>Min Raise:</strong> {content.minRaiseRule}</p>
              <p><strong>Burn:</strong> {content.burn}</p>
              <p><strong>Yan Pot:</strong> {content.sidePots}</p>

              <div>
                <strong>El Sıralaması:</strong>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  {content.handRanks.map((h: string) => (
                    <li key={h}>{h}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


