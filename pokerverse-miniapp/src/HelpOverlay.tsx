import { helpTR } from "./helpContent";
import { useEffect } from "react";

export function HelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white text-black p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-6 mb-4">
          <h2 className="text-lg font-semibold">{helpTR.title}</h2>
          <button className="rounded-lg px-3 py-1 bg-neutral-100 hover:bg-neutral-200" onClick={onClose}>×</button>
        </div>
        <div className="space-y-3 text-sm">
          <p><b>Akış:</b> {helpTR.flow.join(" → ")}</p>
          <p><b>Seçenekler:</b> {helpTR.actions.join(" • ")}</p>
          <p><b>Blinds:</b> {helpTR.blinds}</p>
          <p><b>Min Raise:</b> {helpTR.minRaiseRule}</p>
          <p><b>Burn:</b> {helpTR.burn}</p>
          <p><b>Yan Pot:</b> {helpTR.sidePots}</p>
          <div>
            <b>El Sıralaması:</b>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              {helpTR.handRanks.map((h) => <li key={h}>{h}</li>)}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}


