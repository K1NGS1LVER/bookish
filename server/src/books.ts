import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";

const SORTS: Record<string, string> = {
  relevance: "id ASC",
  price_asc: "price ASC, id ASC",
  price_desc: "price DESC, id ASC",
  rating: "rating DESC, ratingCount DESC, id ASC",
};

export function booksRouter(db: DatabaseSync): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const q = req.query;
    const where: string[] = [];
    const params: (string | number)[] = [];

    if (typeof q.search === "string" && q.search.trim()) {
      const like = `%${q.search.trim()}%`;
      where.push("(title LIKE ? OR author LIKE ? OR isbn LIKE ?)");
      params.push(like, like, like);
    }
    if (typeof q.genres === "string" && q.genres) {
      const genres = q.genres.split(",").filter(Boolean);
      if (genres.length) {
        where.push(`genre IN (${genres.map(() => "?").join(",")})`);
        params.push(...genres);
      }
    }
    const minPrice = Number(q.minPrice);
    if (Number.isFinite(minPrice) && q.minPrice !== "") {
      where.push("price >= ?");
      params.push(minPrice);
    }
    const maxPrice = Number(q.maxPrice);
    if (Number.isFinite(maxPrice) && q.maxPrice !== "") {
      where.push("price <= ?");
      params.push(maxPrice);
    }
    const minRating = Number(q.minRating);
    if (Number.isFinite(minRating) && q.minRating !== "") {
      where.push("rating >= ?");
      params.push(minRating);
    }
    if (q.inStock === "1" || q.inStock === "true") {
      where.push("stock > 0");
    }

    const orderBy = SORTS[String(q.sort)] ?? SORTS.relevance;
    const sql = `SELECT * FROM books ${
      where.length ? `WHERE ${where.join(" AND ")}` : ""
    } ORDER BY ${orderBy}`;

    res.json(db.prepare(sql).all(...params));
  });

  router.get("/:id", (req, res) => {
    const book = db
      .prepare("SELECT * FROM books WHERE id = ?")
      .get(Number(req.params.id));
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.json(book);
  });

  router.get("/:id/related", (req, res) => {
    const id = Number(req.params.id);
    const book = db.prepare("SELECT genre FROM books WHERE id = ?").get(id) as
      | { genre: string }
      | undefined;
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.json(
      db
        .prepare(
          `SELECT * FROM books WHERE genre = ? AND id != ?
           ORDER BY rating DESC LIMIT 6`
        )
        .all(book.genre, id)
    );
  });

  return router;
}
