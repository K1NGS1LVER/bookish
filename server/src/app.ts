import compression from "compression";
import express from "express";
import type { DatabaseSync } from "node:sqlite";
import { booksRouter } from "./books";
import { ordersRouter } from "./orders";
import { rateLimit } from "./rateLimit";

export function createApp(db: DatabaseSync) {
  const app = express();
  app.use(compression());
  app.use(express.json());
  app.use("/api", rateLimit());

  // ponytail: short cache for API, long for static assets
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "private, max-age=30");
    next();
  });
  app.use("/covers", (_req, res, next) => {
    res.set("Cache-Control", "public, max-age=604800, immutable");
    next();
  });

  app.use("/api/books", booksRouter(db));
  app.use("/api/orders", ordersRouter(db));
  return app;
}
