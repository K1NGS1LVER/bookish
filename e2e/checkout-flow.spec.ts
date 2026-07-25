import { test, expect } from "@playwright/test";

test("add to cart, view cart, and checkout", async ({ page }) => {
  await page.goto("/");

  // Navigate to a book
  const firstBookLink = page.getByRole("link", { name: /cover of/i }).first();
  await firstBookLink.click();
  await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();

  // Add to cart
  await page.getByRole("button", { name: /add to cart/i }).first().click();

  // Cart drawer opens
  const dialog = page.getByRole("dialog", { name: "Shopping cart" });
  await expect(dialog).toBeVisible();

  // Cart has at least one item
  const cartItems = dialog.locator("li");
  await expect(cartItems.first()).toBeVisible();

  // Navigate to checkout
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  // Fill out checkout form
  await page.getByLabel("Full name").fill("Jane Doe");
  await page.getByLabel("Email").fill("jane@example.com");
  await page.getByLabel("Phone").fill("9876543210");
  await page.getByLabel("Address").fill("123 Book Lane");
  await page.getByLabel("City").fill("Mumbai");
  await page.getByLabel("State").fill("Maharashtra");
  await page.getByLabel("PIN code").fill("400001");

  // Submit order
  await page.getByRole("button", { name: /place order/i }).click();

  // Success screen appears
  await expect(page.getByRole("heading", { name: "Order placed!" })).toBeVisible();
});
