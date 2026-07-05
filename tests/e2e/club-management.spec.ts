import { test, expect } from "@playwright/test";

test("my-clubs redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/my-clubs");
  await expect(page).toHaveURL(/\/login/);
});

test("admin users page redirects non-master admins", async ({ page }) => {
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login/);
});

test("admin reviews redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin/reviews");
  await expect(page).toHaveURL(/\/login/);
});
