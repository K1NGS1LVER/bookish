import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT NOT NULL UNIQUE,
    genre TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    rating REAL NOT NULL CHECK (rating BETWEEN 0 AND 5),
    ratingCount INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    description TEXT NOT NULL,
    pages INTEGER NOT NULL,
    publisher TEXT NOT NULL,
    year INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pin TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    total REAL NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    orderId INTEGER NOT NULL REFERENCES orders(id),
    bookId INTEGER NOT NULL REFERENCES books(id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    unitPrice REAL NOT NULL
  );
`;

export function openDb(file?: string): DatabaseSync {
  const db = new DatabaseSync(file ?? path.join(here, "..", "bookish.db"));
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  seedIfEmpty(db);
  return db;
}

export function seedIfEmpty(db: DatabaseSync): void {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM books").get() as {
    n: number;
  };
  if (n > 0) return;

  const books = JSON.parse(
    readFileSync(path.join(here, "..", "seed", "books.json"), "utf8")
  ) as Record<string, string | number>[];

  const insert = db.prepare(
    `INSERT INTO books
      (title, author, isbn, genre, price, rating, ratingCount, stock,
       description, pages, publisher, year)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  db.exec("BEGIN");
  for (const b of books) {
    insert.run(
      b.title, b.author, b.isbn, b.genre, b.price, b.rating,
      b.ratingCount, b.stock, b.description, b.pages, b.publisher, b.year
    );
  }
  db.exec("COMMIT");
}
