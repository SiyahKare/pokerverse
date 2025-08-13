import React from "react";
import { getTexture } from "../lib/pixi/atlas";
type Status = "pending"|"ok"|"mismatch"|"idle";
export function HandBadge({ handId, status }: { handId?: string; status: Status }) {
  const name = status==="pending"?"hand-badge-pending":status==="ok"?"hand-badge-ok":status==="mismatch"?"hand-badge-fail":"hand-badge-pending";
  const tex = getTexture(name, true);
  return (
    <div data-testid="hand-badge" data-status={status} className="fixed top-2 right-2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgba(0,0,0,.6)] text-white">
      <span className="text-xs opacity-80">Hand</span>
      <span className="text-sm font-medium">{handId ?? "—"}</span>
      {/* Placeholder: tek atlas altında badge dokuları kart atlasından alınabilir; şu an fallback emoji */}
      {tex ? <span /> : <span>{status==="ok"?"✅":status==="mismatch"?"❌":"⌛"}</span>}
    </div>
  );
}


