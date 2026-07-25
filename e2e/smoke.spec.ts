import { test, expect } from "@playwright/test";

test("app loads and shows homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Bookish/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
