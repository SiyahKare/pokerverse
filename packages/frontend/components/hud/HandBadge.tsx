"use client";
import React from "react";
import { useTableStore } from "@/lib/store/useTableStore";
import { getTexture } from "@/lib/pixi/atlas";

type Status = "pending" | "ok" | "mismatch" | "idle";
const map: Record<Status,string> = {
  pending: "hand-badge-pending",
  ok: "hand-badge-ok",
  mismatch: "hand-badge-fail",
  idle: "hand-badge-pending"
};

export default function HandBadge() {
  const { handId, verified } = useTableStore(s => ({ handId: s.handId, verified: s.verified }));
  const status: Status = verified === "pending" ? "pending" : verified === "ok" ? "ok" : verified === "mismatch" ? "mismatch" : "idle";
  const texName = map[status];
  const hasTex = !!getTexture(texName);
  return (
    <div data-testid="hand-badge" data-status={status} className="fixed top-2 right-2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgba(0,0,0,.6)] text-[--text] backdrop-blur">
      <span className="text-xs opacity-80">Hand</span>
      <span className="text-sm font-medium">{handId ?? "—"}</span>
      <span className="inline-flex items-center gap-1">
        {hasTex ? <img src={`/assets/atlas/${texName}.png`} alt={status} width={18} height={18}/> :
          <span aria-label={status} role="img">{status==="ok"?"✅":status==="mismatch"?"❌":"⌛"}</span>}
      </span>
    </div>
  );
}


