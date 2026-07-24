import express from "express";
import type { DatabaseSync } from "node:sqlite";
import { booksRouter } from "./books";
import { ordersRouter } from "./orders";
import { rateLimit } from "./rateLimit";

export function createApp(db: DatabaseSync) {
  const app = express();
  app.use(express.json());
  app.use("/api", rateLimit());
  app.use("/api/books", booksRouter(db));
  app.use("/api/orders", ordersRouter(db));
  return app;
}
