import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clampQty, type Book, type CartItem } from "shared";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** Bumped on every add so the header badge can replay its pulse. */
  addCount: number;
  add: (book: Book, qty?: number) => void;
  remove: (bookId: number) => void;
  setQty: (bookId: number, qty: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addCount: 0,
      add: (book, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.book.id === book.id);
          const items = existing
            ? s.items.map((i) =>
                i.book.id === book.id
                  ? { ...i, qty: clampQty(i.qty + qty, book.stock) }
                  : i
              )
            : [...s.items, { book, qty: clampQty(qty, book.stock) }];
          return { items, addCount: s.addCount + 1 };
        }),
      remove: (bookId) =>
        set((s) => ({ items: s.items.filter((i) => i.book.id !== bookId) })),
      setQty: (bookId, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.book.id === bookId
              ? { ...i, qty: clampQty(qty, i.book.stock) }
              : i
          ),
        })),
      clear: () => set({ items: [] }),
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
    }),
    {
      name: "bookish-cart",
      partialize: (s) => ({ items: s.items }),
    }
  )
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}
