"use client";
import React from "react";
import * as PIXI from "pixi.js";
import { gsap } from "gsap";

type MoveChipParams = {
  layer: PIXI.Container;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

export function tweenChipMove({ layer, from, to }: MoveChipParams) {
  const chip = new PIXI.Graphics();
  chip.circle(0, 0, 12).fill(0xffcc00).stroke({ color: 0x8b6f00, width: 2 });
  chip.x = from.x; chip.y = from.y;
  chip.alpha = 0;
  layer.addChild(chip);
  gsap.to(chip, { alpha: 1, duration: 0.1 });
  gsap.to(chip, { x: to.x, y: to.y, duration: 0.25, ease: "power2.out" });
  gsap.to(chip, { alpha: 0, delay: 0.25, duration: 0.1, onComplete: () => layer.removeChild(chip) });
}

export default function ChipStack() { return null; }


