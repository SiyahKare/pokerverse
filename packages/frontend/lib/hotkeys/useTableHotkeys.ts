"use client";
import { useEffect } from "react";
import { useTableStore } from "@/lib/store/useTableStore";

export function useTableHotkeys(getAmount: () => bigint | null) {
  const { validActions, sendAction } = useTableStore(s => ({ validActions: s.validActions || [], sendAction: s.sendAction }));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "f" && validActions.includes("fold")) { e.preventDefault(); sendAction?.('fold'); }
      if (k === "c" && (validActions.includes("check") || validActions.includes("call"))) { e.preventDefault(); sendAction?.(validActions.includes("check")? 'check':'call'); }
      if (k === "r" && validActions.includes("raise")) { e.preventDefault(); const amt = getAmount(); sendAction?.('raise', amt ?? undefined); }
    };
    window.addEventListener("keydown", onKey, { passive:false });
    return () => window.removeEventListener("keydown", onKey);
  }, [validActions, getAmount, sendAction]);
}


