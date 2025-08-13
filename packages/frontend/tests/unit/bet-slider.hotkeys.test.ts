import { describe, it, expect } from "vitest";
import { clampBigInt } from "../utils/format.mock";

describe("bet-slider bigint ops", () => {
  const min=100n, max=1000n, step=50n;
  it("clamps and steps correctly", () => {
    expect(clampBigInt(90n,min,max)).toBe(100n);
    expect(clampBigInt(1050n,min,max)).toBe(1000n);
    expect((150n + step)).toBe(200n);
  });
});


