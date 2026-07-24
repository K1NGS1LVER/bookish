import type { NextFunction, Request, Response } from "express";

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window rate limiter, per client IP.
 * ponytail: in-memory Map is enough for a single-process local app;
 * swap for a shared store if this ever runs on more than one node.
 */
export function rateLimit(limit = 300, windowMs = 60_000) {
  const windows = new Map<string, Window>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    let win = windows.get(key);

    if (!win || now >= win.resetAt) {
      win = { count: 0, resetAt: now + windowMs };
      windows.set(key, win);
    }
    win.count += 1;

    if (windows.size > 10_000) {
      for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
    }

    if (win.count > limit) {
      res
        .status(429)
        .set("Retry-After", String(Math.ceil((win.resetAt - now) / 1000)))
        .json({ error: "Too many requests. Please slow down." });
      return;
    }
    next();
  };
}
