import { test, expect } from "@playwright/test";

test("theme toggle switches between light and dark", async ({ page }) => {
  await page.goto("/");

  // Default is light mode
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");

  // Click the theme toggle button
  const toggle = page.getByRole("button", { name: /switch to dark mode/i });
  await expect(toggle).toBeVisible();
  await toggle.click();

  // Should switch to dark mode
  await expect(html).toHaveAttribute("data-theme", "dark");

  // Button label updates
  await expect(page.getByRole("button", { name: /switch to light mode/i })).toBeVisible();

  // Toggle back to light
  await page.getByRole("button", { name: /switch to light mode/i }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
});
