import { test, expect } from "@playwright/test";
test("miniapp table smoke", async ({ page }) => {
  await page.goto("/table/1");
  await expect(page.locator("canvas")).toBeVisible();
  await page.evaluate(() => (window as any).__PV_DEV__?.emit("rng:commit", { handId:"h1", commit: "0x" + "ab".repeat(32) }));
  await expect(page.getByTestId("hand-badge")).toHaveAttribute("data-status", "pending");
  await page.evaluate(() => (window as any).__PV_DEV__?.emit("rng:reveal", { seed: "0x" + "11".repeat(32) }));
  await expect(page.locator("canvas")).toBeVisible();
});


