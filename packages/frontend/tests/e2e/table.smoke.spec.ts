import { test, expect } from "@playwright/test";

test("table smoke", async ({ page }) => {
  await page.goto("/tables/1");
  await expect(page.locator("canvas")).toBeVisible();
  // dev-only helpers: window.__PV_DEV__?.emit
  await page.evaluate(() => (window as any).__PV_DEV__?.emit("rng:commit", { tableId:1, handId: 1, commit: "0x" + "ab".repeat(32) }));
  await expect(page.getByTestId('hand-badge')).toHaveAttribute('data-status', /pending|idle/);
  await page.evaluate(() => (window as any).__PV_DEV__?.emit("rng:reveal", { tableId:1, handId:1, seed: "0x" + "11".repeat(32) }));
  await expect(page.getByTestId('hand-badge')).toHaveAttribute('data-status', /ok|mismatch/);
  await page.evaluate(() => (window as any).__PV_DEV__?.emit("action:request", { validActions:["fold","raise"], betBounds:{min:"100",max:"1000",step:"50"}}));
  await expect(page.getByRole("button", { name: /Fold/i })).toBeEnabled();
  // spam click 30x
  for (let i=0;i<30;i++){ await page.getByRole('button', { name: /Fold/i }).click(); }
});


