"use client";
import React, { useEffect, useMemo, useRef } from "react";
import * as PIXI from "pixi.js";
import { gsap } from "gsap";

export type SeatInfo = {
  seat: number;
  name?: string;
  avatarUrl?: string;
  stack?: number; // chips in UI units (not wei)
  isTurn?: boolean;
  isSitting?: boolean;
};

export type LastAction = {
  seat: number;
  kind: "check" | "bet" | "call" | "raise" | "fold";
  amount?: number;
};

type Props = {
  seats: SeatInfo[]; // length up to 9
  potAmount: number; // UI units
  communityCards: string[]; // e.g., ["AS","KD","Tc"]
  playerCards: Record<number, string[]>; // seat -> [c1,c2]
  lastAction?: LastAction | null;
  className?: string;
};

const CANVAS_W = 1920;
const CANVAS_H = 1080;

// Simple helpers to place seats in an oval around the table
const seatPolar = (i: number, n: number) => {
  const angle = (-Math.PI / 2) + (i * (2 * Math.PI) / n);
  const rx = CANVAS_W * 0.36;
  const ry = CANVAS_H * 0.28;
  const cx = CANVAS_W * 0.5;
  const cy = CANVAS_H * 0.48;
  return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
};

export default function TableCanvas({ seats, potAmount, communityCards, playerCards, lastAction, className }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const rootRef = useRef<PIXI.Container | null>(null);

  const seatCount = useMemo(() => Math.max(2, Math.min(9, seats.length || 9)), [seats.length]);

  useEffect(() => {
    if (!wrapRef.current) return;
    if (appRef.current) return; // init once

    const app = new PIXI.Application({
      width: CANVAS_W,
      height: CANVAS_H,
      background: "#0b1620",
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    appRef.current = app;
    wrapRef.current.appendChild(app.view as unknown as Node);

    const root = new PIXI.Container();
    rootRef.current = root;
    app.stage.addChild(root);

    // Table felt ellipse
    const felt = new PIXI.Graphics();
    felt.beginFill(0x114d2c);
    felt.drawRoundedRect(CANVAS_W * 0.1, CANVAS_H * 0.18, CANVAS_W * 0.8, CANVAS_H * 0.64, 60);
    felt.endFill();
    root.addChild(felt);

    // Pot text
    const potText = new PIXI.Text({ text: `Pot: ${potAmount.toFixed(2)}`, style: { fill: 0xffffff, fontSize: 28 } });
    potText.x = CANVAS_W * 0.5 - potText.width / 2;
    potText.y = CANVAS_H * 0.42;
    potText.name = "potText";
    root.addChild(potText);

    // Community cards container
    const board = new PIXI.Container();
    board.name = "board";
    board.x = CANVAS_W * 0.5;
    board.y = CANVAS_H * 0.5;
    root.addChild(board);

    // Seats container
    const seatsLayer = new PIXI.Container();
    seatsLayer.name = "seats";
    root.addChild(seatsLayer);

    // Handle responsive scaling
    const resize = () => {
      if (!wrapRef.current) return;
      const w = wrapRef.current.clientWidth;
      const h = wrapRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      const scale = Math.min(w / CANVAS_W, h / CANVAS_H);
      root.scale.set(scale);
      root.x = (w - CANVAS_W * scale) / 2;
      root.y = (h - CANVAS_H * scale) / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      app.destroy(true);
      appRef.current = null;
      rootRef.current = null;
    };
  }, []);

  // Update dynamic layers on prop change
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Update pot
    const potText = root.getChildByName("potText") as PIXI.Text | null;
    if (potText) potText.text = `Pot: ${potAmount.toFixed(2)}`;

    // Render community cards (simple rectangles with labels)
    const board = root.getChildByName("board") as PIXI.Container | null;
    if (board) {
      board.removeChildren();
      const gap = 20;
      const w = 110;
      const h = 160;
      const totalW = communityCards.length * w + (communityCards.length - 1) * gap;
      let x0 = -totalW / 2;
      communityCards.forEach((code, idx) => {
        const card = new PIXI.Container();
        const g = new PIXI.Graphics();
        g.roundRect(0, 0, w, h, 10).fill(0xffffff);
        const label = new PIXI.Text({ text: code, style: { fill: 0x111111, fontSize: 26, fontWeight: "bold" } });
        label.x = 10; label.y = 10;
        card.addChild(g, label);
        card.x = x0 + idx * (w + gap);
        card.y = 0;
        card.pivot.set(w / 2, h / 2);
        card.scale.set(0, 1);
        board.addChild(card);
        gsap.to(card.scale, { x: 1, duration: 0.3, ease: "power2.out", delay: idx * 0.05 }); // flip-like appear
      });
    }

    // Render seats
    const seatsLayer = root.getChildByName("seats") as PIXI.Container | null;
    if (seatsLayer) {
      seatsLayer.removeChildren();
      const n = seatCount;
      for (let i = 0; i < n; i += 1) {
        const pos = seatPolar(i, n);
        const seat = seats[i];
        const c = new PIXI.Container();

        // Avatar circle
        const av = new PIXI.Graphics();
        av.circle(0, 0, 36).fill(0x333a45);
        c.addChild(av);

        // Name
        const nm = new PIXI.Text({ text: seat?.name ?? `Seat ${i+1}`, style: { fill: 0xffffff, fontSize: 16 } });
        nm.y = 46; nm.x = -nm.width/2;
        c.addChild(nm);

        // Stack
        const st = new PIXI.Text({ text: seat?.stack != null ? `${seat.stack.toFixed(2)}` : "", style: { fill: 0xbadfff, fontSize: 14 } });
        st.y = 66; st.x = -st.width/2;
        c.addChild(st);

        // Turn ring
        if (seat?.isTurn) {
          const ring = new PIXI.Graphics();
          ring.circle(0, 0, 42).stroke({ color: 0x39ff88, width: 3 });
          c.addChild(ring);
        }

        c.x = pos.x; c.y = pos.y;
        c.pivot.set(0,0);
        c.alpha = seat?.isSitting === false ? 0.25 : 1;
        seatsLayer.addChild(c);
      }
    }

    // Action banner
    if (lastAction) {
      let banner = root.getChildByName("actionBanner") as PIXI.Container | null;
      if (banner) root.removeChild(banner);
      banner = new PIXI.Container();
      banner.name = "actionBanner";
      const bg = new PIXI.Graphics();
      bg.roundRect(0,0, 280, 60, 10).fill(0x202833).stroke({ color: 0x4b5563, width: 2});
      const txt = new PIXI.Text({ text: `Seat ${lastAction.seat+1}: ${lastAction.kind.toUpperCase()} ${lastAction.amount ?? ""}`,
        style: { fill: 0xffffff, fontSize: 18 }});
      txt.x = 12; txt.y = 18;
      banner.addChild(bg, txt);
      banner.x = CANVAS_W/2 - 140; banner.y = CANVAS_H*0.16;
      banner.alpha = 0;
      root.addChild(banner);
      gsap.to(banner, { alpha: 1, y: banner.y + 10, duration: 0.25, ease: "power2.out" });
      gsap.to(banner, { alpha: 0, y: banner.y - 10, delay: 1.8, duration: 0.25, ease: "power1.in" });
    }
  }, [potAmount, communityCards, seats, seatCount, lastAction]);

  return (
    <div ref={wrapRef} className={"w-full h-[62vh] md:h-[70vh] lg:h-[78vh] flex items-center justify-center " + (className ?? "")}/>
  );
}


