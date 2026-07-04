import { test, expect } from "@playwright/test";

test("planner redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/planner");
  await expect(page).toHaveURL(/\/login/);
});

test("discover redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/discover");
  await expect(page).toHaveURL(/\/login/);
});

test("friends redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/friends");
  await expect(page).toHaveURL(/\/login/);
});

test("admin redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});
