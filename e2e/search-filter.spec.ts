import { test, expect } from "@playwright/test";

test("search and filter books", async ({ page }) => {
  await page.goto("/");

  // Desktop search is visible
  const searchInput = page.getByLabel("Search books");
  await expect(searchInput).toBeVisible();

  // Type a search query
  await searchInput.fill("great");

  // Results update - check that the catalog section has results
  // The search navigates to /?search=great#catalog
  await expect(page).toHaveURL(/search=great/);
});
