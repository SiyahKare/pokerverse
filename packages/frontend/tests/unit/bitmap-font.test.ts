import { describe, it, expect } from "vitest";

const mapGlyph = (s: string) => s.replace(/[0-9,.kM]/g, "•");

describe("bitmap font mapping", () => {
  it("maps digits and separators", () => {
    expect(mapGlyph("12,345.6k")).toBe("•••••••••");
  });
});


