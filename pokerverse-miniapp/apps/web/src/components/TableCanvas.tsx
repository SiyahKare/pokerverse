import React, { useEffect, useRef } from "react";
import { Application, extend } from "@pixi/react";
import { Container as PixiContainer, Sprite as PixiSprite } from 'pixi.js'
extend({ Container: PixiContainer, Sprite: PixiSprite })
import { ensureAtlasLoaded, getTexture } from "../lib/pixi/atlas";
import { registerAtlas } from "../lib/pixi/registerAtlas";
import { registerChipsDigits } from "../lib/pixi/bitmapFont";

export default function TableCanvas() {
  const dpr = Math.min((globalThis as any).devicePixelRatio ?? 1, 2);
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);
  useEffect(() => { registerAtlas(); registerChipsDigits(); ensureAtlasLoaded({quality:'auto'}); }, []);
  const felt = getTexture("table-felt");
  return (
    <div ref={ref} className="relative w-full h-full">
      <Application width={size.w} height={size.h} options={{ antialias:false, backgroundAlpha:1, autoDensity:true, powerPreference:"high-performance", resolution:dpr }}>
        <Container>
          {felt && <Sprite texture={felt} width={size.w} height={size.h} />}
        </Container>
      </Application>
    </div>
  );
}
function useSize(ref: React.RefObject<HTMLElement>) {
  const [s, setS] = React.useState({w: 300, h: 200});
  React.useEffect(()=>{
    const el = ref.current; if(!el) return;
    const ro = new ResizeObserver(()=>{
      const r = el.getBoundingClientRect(); setS({w: Math.floor(r.width), h: Math.floor(r.height)});
    }); ro.observe(el); return ()=>ro.disconnect();
  },[]);
  return s;
}


