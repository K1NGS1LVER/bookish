export const TAX_RATE = 0.05;

/** Clamp a requested quantity to [1, stock]. Stock of 0 still clamps to 1;
 *  callers must not allow adding out-of-stock books in the first place. */
export function clampQty(qty: number, stock: number): number {
  const n = Number.isFinite(qty) ? Math.floor(qty) : 1;
  return Math.min(Math.max(1, n), Math.max(1, stock));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface Totals {
  subtotal: number;
  tax: number;
  total: number;
}

export function cartTotals(
  items: { price: number; qty: number }[]
): Totals {
  const subtotal = round2(
    items.reduce((sum, item) => sum + item.price * item.qty, 0)
  );
  const tax = round2(subtotal * TAX_RATE);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

export function formatPrice(n: number): string {
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
