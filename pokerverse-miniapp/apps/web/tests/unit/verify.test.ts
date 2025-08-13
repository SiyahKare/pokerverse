import { describe, it, expect } from "vitest";
import { deterministicShuffle, deckHash } from "@pokerverse/core-game";
it("deterministic deck hash", () => {
  const seed = "0x" + "11".repeat(32);
  const order = deterministicShuffle(seed);
  const h = deckHash(order);
  expect(h).toMatch(/^0x[0-9a-fA-F]{64}$/);
});


