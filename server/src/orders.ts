import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import {
  cartTotals,
  validateCheckout,
  type Book,
  type OrderConfirmation,
  type OrderInput,
} from "shared";

export function ordersRouter(db: DatabaseSync): Router {
  const router = Router();

  router.post("/", (req, res) => {
    const input = req.body as OrderInput;

    const errors = validateCheckout(input);
    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: "Validation failed", fields: errors });
      return;
    }

    const items = Array.isArray(input.items) ? input.items : [];
    if (items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }
    for (const item of items) {
      if (
        !Number.isInteger(item.bookId) ||
        !Number.isInteger(item.qty) ||
        item.qty < 1
      ) {
        res.status(400).json({ error: "Invalid cart items" });
        return;
      }
    }

    const getBook = db.prepare("SELECT * FROM books WHERE id = ?");
    const decrement = db.prepare(
      "UPDATE books SET stock = stock - ? WHERE id = ? AND stock >= ?"
    );
    const insertOrder = db.prepare(
      `INSERT INTO orders
        (name, email, phone, address, city, state, pin, subtotal, tax, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertItem = db.prepare(
      "INSERT INTO order_items (orderId, bookId, qty, unitPrice) VALUES (?, ?, ?, ?)"
    );

    db.exec("BEGIN");
    try {
      const lines: OrderConfirmation["items"] = [];
      const priced: { price: number; qty: number }[] = [];

      for (const item of items) {
        const book = getBook.get(item.bookId) as Book | undefined;
        if (!book) throw new ClientError(`Book ${item.bookId} not found`);
        const changed = decrement.run(item.qty, item.bookId, item.qty);
        if (changed.changes === 0) {
          throw new ClientError(`Not enough stock for "${book.title}"`);
        }
        lines.push({
          title: book.title,
          author: book.author,
          qty: item.qty,
          unitPrice: book.price,
        });
        priced.push({ price: book.price, qty: item.qty });
      }

      const totals = cartTotals(priced);
      const order = insertOrder.run(
        input.name.trim(), input.email.trim(), input.phone.trim(),
        input.address.trim(), input.city.trim(), input.state.trim(),
        input.pin.trim(), totals.subtotal, totals.tax, totals.total
      );
      const orderId = Number(order.lastInsertRowid);
      for (let i = 0; i < items.length; i++) {
        insertItem.run(orderId, items[i].bookId, items[i].qty, priced[i].price);
      }
      db.exec("COMMIT");

      const confirmation: OrderConfirmation = {
        orderNumber: `BK-${String(orderId).padStart(5, "0")}`,
        ...totals,
        items: lines,
      };
      res.status(201).json(confirmation);
    } catch (err) {
      db.exec("ROLLBACK");
      if (err instanceof ClientError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  return router;
}

class ClientError extends Error {}
