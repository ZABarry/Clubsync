import { test, expect } from "@playwright/test";

test("invite page prompts login when unauthenticated", async ({ page }) => {
  const token = "a".repeat(64);
  await page.goto(`/invite/${token}`);
  await expect(page).toHaveURL(/\/login/);
});

test("invite page preserves redirect after login prompt", async ({ page }) => {
  const token = "b".repeat(64);
  await page.goto(`/invite/${token}`);
  await expect(page).toHaveURL(/redirect=%2Finvite%2F/);
});
