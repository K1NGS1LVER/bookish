import type { Book, OrderConfirmation, OrderInput } from "shared";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("Could not reach the store. Is the server running?", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      body.error ?? `Request failed (${res.status})`,
      res.status,
      body.fields
    );
  }
  return body as T;
}

export interface BookQuery {
  search?: string;
  genres?: string[];
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: boolean;
  sort?: string;
}

export function fetchBooks(q: BookQuery): Promise<Book[]> {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.genres?.length) params.set("genres", q.genres.join(","));
  if (q.minPrice) params.set("minPrice", q.minPrice);
  if (q.maxPrice) params.set("maxPrice", q.maxPrice);
  if (q.minRating) params.set("minRating", q.minRating);
  if (q.inStock) params.set("inStock", "1");
  if (q.sort) params.set("sort", q.sort);
  const qs = params.toString();
  return request<Book[]>(`/api/books${qs ? `?${qs}` : ""}`);
}

export function fetchBook(id: number): Promise<Book> {
  return request<Book>(`/api/books/${id}`);
}

export function fetchRelated(id: number): Promise<Book[]> {
  return request<Book[]>(`/api/books/${id}/related`);
}

export function createOrder(input: OrderInput): Promise<OrderConfirmation> {
  return request<OrderConfirmation>("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function coverUrl(isbn: string): string {
  return `/covers/${isbn}.jpg`;
}

export function coverUrlWebp(isbn: string): string {
  return `/covers/${isbn}.webp`;
}
