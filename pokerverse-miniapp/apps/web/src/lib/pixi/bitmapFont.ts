import { BitmapFont } from "pixi.js";
let reg=false;
export function registerChipsDigits() {
  if (reg) return;
  BitmapFont.from("ChipsDigits", {
    fontFamily: "ui-mono, monospace",
    fontSize: 32,
    fill: 0xffffff
  }, { chars: BitmapFont.NUMERIC + "kM,.", resolution: 2 });
  reg=true;
}


