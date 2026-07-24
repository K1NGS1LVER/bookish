import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Book } from "shared";
import { createApp } from "../src/app";
import { openDb } from "../src/db";

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(openDb(":memory:"));
});

const VALID_ORDER = {
  name: "Dan Tester",
  email: "dan@example.com",
  phone: "9876543210",
  address: "42 Library Lane",
  city: "Chennai",
  state: "Tamil Nadu",
  pin: "600001",
};

describe("GET /api/books", () => {
  it("returns the seeded catalog", async () => {
    const res = await request(app).get("/api/books");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(24);
  });

  it("searches title and author case-insensitively", async () => {
    const res = await request(app).get("/api/books?search=weir");
    const titles = res.body.map((b: Book) => b.title).sort();
    expect(titles).toEqual(["Project Hail Mary", "The Martian"]);
  });

  it("combines genre, price, and stock filters", async () => {
    const res = await request(app).get(
      "/api/books?genres=Science Fiction&maxPrice=450&inStock=1"
    );
    for (const book of res.body as Book[]) {
      expect(book.genre).toBe("Science Fiction");
      expect(book.price).toBeLessThanOrEqual(450);
      expect(book.stock).toBeGreaterThan(0);
    }
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("sorts by price ascending", async () => {
    const res = await request(app).get("/api/books?sort=price_asc");
    const prices = res.body.map((b: Book) => b.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("404s for a missing book id", async () => {
    const res = await request(app).get("/api/books/9999");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/orders", () => {
  it("creates an order, returns totals, and decrements stock", async () => {
    const before = await request(app).get("/api/books/1");
    const res = await request(app)
      .post("/api/orders")
      .send({ ...VALID_ORDER, items: [{ bookId: 1, qty: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^BK-\d{5}$/);
    expect(res.body.subtotal).toBe(before.body.price * 2);
    expect(res.body.total).toBeCloseTo(before.body.price * 2 * 1.05, 2);

    const after = await request(app).get("/api/books/1");
    expect(after.body.stock).toBe(before.body.stock - 2);
  });

  it("rejects invalid fields with per-field errors", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ ...VALID_ORDER, email: "nope", items: [{ bookId: 1, qty: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.fields.email).toBeTruthy();
  });

  it("rejects orders exceeding stock and rolls back", async () => {
    const before = await request(app).get("/api/books/1");
    const res = await request(app)
      .post("/api/orders")
      .send({ ...VALID_ORDER, items: [{ bookId: 1, qty: 999 }] });
    expect(res.status).toBe(409);

    const after = await request(app).get("/api/books/1");
    expect(after.body.stock).toBe(before.body.stock);
  });

  it("rejects an empty cart", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ ...VALID_ORDER, items: [] });
    expect(res.status).toBe(400);
  });
});
