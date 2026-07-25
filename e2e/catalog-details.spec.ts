import { test, expect } from "@playwright/test";

test("browse catalog and view book details", async ({ page }) => {
  await page.goto("/");

  // Catalog section is visible with book cards
  const catalog = page.getByRole("heading", { name: /shelves/i });
  await expect(catalog).toBeVisible();

  // Click the first book card link
  const firstBookLink = page.getByRole("link", { name: /cover of/i }).first();
  await expect(firstBookLink).toBeVisible();
  await firstBookLink.click();

  // Book details page loads
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();

  // Description accordion is open by default (uses <details>/<summary>)
  await expect(page.getByRole("group").filter({ hasText: "Description" })).toBeVisible();

  // "Add to cart" button is present
  await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
});
