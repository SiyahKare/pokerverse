import React, { useEffect, useState } from "react";
import { HandBadge } from "../../components/HandBadge";
import TableCanvas from "../../components/TableCanvas";
import { deterministicShuffle, deckHash } from "@pokerverse/core-game";
import { z } from "zod";

type V = "pending"|"ok"|"mismatch"|"idle";
const CommitSchema = z.object({ handId: z.string(), commit: z.string() });
const RevealSchema = z.object({ seed: z.string() });

export default function TablePage() {
  const [handId,setHandId]=useState<string|undefined>();
  const [commit,setCommit]=useState<string|undefined>();
  const [verified,setVerified]=useState<V>("idle");

  useEffect(()=>{
    if (typeof window === "undefined") return;
    (window as any).__PV_DEV__ = {
      emit: (type: string, payload: any) => {
        if (type==="rng:commit") {
          const ok = CommitSchema.safeParse(payload); if (!ok.success) return;
          setHandId(ok.data.handId); setCommit(ok.data.commit); setVerified("pending");
        }
        if (type==="rng:reveal") {
          const ok = RevealSchema.safeParse(payload); if (!ok.success || !commit) return;
          const order = deterministicShuffle(ok.data.seed);
          const h = deckHash(order);
          setVerified(h.toLowerCase() === commit.toLowerCase() ? "ok" : "mismatch");
        }
      }
    };
  }, [commit]);

  return (
    <div className="w-screen h-screen">
      <TableCanvas />
      <HandBadge handId={handId} status={verified}/>
    </div>
  );
}


