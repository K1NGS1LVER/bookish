# Bookish - Online Book Store: Design Spec

Date: 2026-07-25.
Assessment: CISOGenie UI Developer internship, round 2.
Visual and layout detail lives in `design.md` at the repo root.
This spec records the architecture and the decisions that amend `design.md`.

## Goals

Build the full feature set: book catalog, search, filters, book details, shopping cart, quantity management, and checkout summary (no payment).
Evaluation focus: form validation, component design, responsive layout.
Bonus targets: unit tests, accessibility, UI polish.
The app must run completely offline after `pnpm install`.

## Stack

- pnpm workspace with two packages: `client/` and `server/`.
- Client: Vite, React 18, TypeScript, Zustand for cart state, CSS modules for component styles.
- Server: Express, TypeScript run via `tsx`, built-in `node:sqlite` (requires Node 22 or newer, so no native compile step).
- `pnpm dev` runs both packages with `pnpm -r --parallel dev`.
- Vite dev server proxies `/api` to Express on port 3001.

## Decisions (amendments to design.md)

1. No Google Fonts import.
   Fraunces and Inter woff2 files are committed under `client/public/fonts/` and loaded with `@font-face`.
2. No runtime network for covers.
   About 24 real cover images are downloaded once during development from Open Library and committed under `client/public/covers/`.
3. All CSS values are tokenized in a single `theme.css`.
   Component CSS modules may only use `var(--*)` references.
   No hardcoded colors, shadows, radii, or font sizes outside `theme.css`.
   Inline styles are allowed only for truly dynamic values, such as cover rotation angles.
4. Light and dark mode.
   Default follows `prefers-color-scheme`, with a manual toggle in the header.
   The choice is stored in `localStorage` and applied as `data-theme` on `<html>`.
   Dark mode is a full second token set with a warm near-black palette.
   Every text and background pair must pass WCAG AA (4.5:1 body, 3:1 large text) in both modes, verified by a contrast-check script before commit.
5. API rate limiting.
   A small custom Express middleware (fixed window per IP) returns 429 with a `Retry-After` header.
   No external dependency.
6. Error handling.
   A React `ErrorBoundary` wraps the routes with a styled fallback.
   Fetch-level errors render inline error states with a retry button, since boundaries do not catch async errors.
7. Progressive responsiveness.
   CSS is written mobile-first and enhanced at 768px and 1024px, per the breakpoints in `design.md`.
8. Visual hierarchy follows the type scale and spacing rhythm in `design.md` and is checked in a final review pass.

## API

- `GET /api/books` with query params `search`, `genres`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `sort`.
  Filtering and sorting happen in SQL with parameterized queries.
- `GET /api/books/:id` returns one book.
- `GET /api/books/:id/related` returns same-genre books, excluding the book itself.
- `POST /api/orders` re-validates the payload server-side, checks stock, decrements stock, stores the order and its items, and returns an order number.

## Data model

- `books`: id, title, author, isbn, genre, price, rating, rating_count, stock, description, pages, publisher, year.
- `orders`: id, name, email, phone, address, city, state, pin, subtotal, tax, total, created_at.
- `order_items`: order_id, book_id, qty, unit_price.
- The server auto-seeds 24 books across 6 genres on boot when the DB file is missing.

## Validation

One shared validation module is imported by both the checkout form and the orders endpoint.
Rules: required fields, email format, phone is 10 digits, PIN is 6 digits.
Client behavior: validate on blur, re-validate on change after the first error, `aria-invalid` and `aria-describedby` wiring, submit disabled until valid.

## Cart

Zustand store persisted to `localStorage`.
Quantity clamps to the range 1 to stock.
Drawer traps focus while open and closes on Escape.

## Testing

Vitest for cart store math and validation rules.
Supertest for the books filter endpoint.
Few tests, each meaningful.

## Out of scope

No auth, wishlist, recommendations engine, payment, admin panel, or i18n, per `design.md` section 6.

## Delivery

Clean incremental commit history with conventional messages and no co-author trailers.
README with setup instructions, the Node 22+ assumption, and an assumptions section.
