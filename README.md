# Bookish - Online Book Store

A small e-commerce interface for books, built for the CISOGenie UI Developer assessment.
React + TypeScript on the front, Express + SQLite on the back, and it runs completely offline.

| Light | Dark |
| --- | --- |
| ![Home page, light mode](docs/screenshots/home-light.png) | ![Home page, dark mode](docs/screenshots/home-dark.png) |

## Features

- Book catalog of 60 seeded titles across 6 genres.
- Debounced search across title, author, and ISBN.
- Filters: genre, price range, minimum rating, in-stock only, with removable active-filter chips.
- Sorting: relevance, price (both directions), rating.
- Book details page with sticky cover, accordion sections, and a "More like this" carousel (snap scrolling, prev/next arrows).
- Slide-over shopping cart with quantity stepper (typing allowed, clamps to stock), persisted to localStorage.
- Checkout summary with full form validation and a 5% mock tax. No payment gateway.
- Light and dark themes with a toggle. Every text/background pair passes WCAG AA (verified by script).
- API rate limiting, React error boundary, and per-request error states with retry.

## Requirements

- Node.js 22 or newer (the server uses the built-in `node:sqlite`, so there is no native compile step).
- pnpm 9+ (`corepack enable` or `npm i -g pnpm`).

## Getting started

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173 (backend runs on port 3001; Vite proxies `/api` to it automatically).
The SQLite database (`server/bookish.db`) is created and seeded on first boot — nothing else to configure.
To reset the store, delete `server/bookish.db` and restart.

That's it. `pnpm dev` runs both frontend and backend together in one terminal.

### Running frontend/backend separately

Only need one of them (e.g. hitting the API from Postman, or working on UI against an already-running server)?

```bash
pnpm dev:server   # Express API only  -> http://localhost:3001
pnpm dev:client   # Vite frontend only -> http://localhost:5173 (needs the server running for data)
```

### Other commands

```bash
pnpm test            # 21 unit/integration tests (Vitest + Supertest)
pnpm build           # typecheck both packages and build the client
pnpm check:contrast  # WCAG AA audit of every theme token pair, light and dark
```

## Project structure

```
client/   Vite + React + TypeScript UI (Zustand cart, CSS modules, motion/lenis/embla/sonner/lucide for animation)
server/   Express + node:sqlite API (search/filter/sort in SQL, orders, rate limit)
shared/   Types, validation rules, and cart math imported by BOTH sides
scripts/  check-contrast.mjs - parses theme.css and fails if any pair drops below AA
```

The validation module in `shared/` is the single source of truth:
the checkout form and the `POST /api/orders` endpoint run the exact same rules, so the client and server can never disagree about what a valid order is.

### API

| Route | Description |
| --- | --- |
| `GET /api/books` | Catalog. Query params: `search`, `genres`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `sort`. All filtering happens in SQL with parameterized queries. |
| `GET /api/books/:id` | One book. |
| `GET /api/books/:id/related` | Up to 6 same-genre books. |
| `POST /api/orders` | Re-validates server-side, checks and decrements stock in a transaction, returns an order number and totals. |

## Form validation

Every form, filter, and quantity control in the app validates its input and shows the user why, not just what. Nothing fails silently.

| Where | Rules | Feedback |
| --- | --- | --- |
| **Checkout** (`CheckoutPage`) | Name required (2+ chars) · email format · phone exactly 10 digits · address required (5+ chars) · city/state required · PIN exactly 6 digits | Validates on blur, then re-validates on every keystroke once a field has shown an error. Invalid border + inline message with an icon, wired with `aria-invalid`/`aria-describedby`. Submit button stays disabled until the whole form is valid. Server (`POST /api/orders`) re-runs the exact same rules from `shared/validation.ts` and returns 400 with per-field errors if bypassed — client and server can never disagree. |
| **Newsletter** (footer) | Same email regex as checkout, reused from `shared` rather than duplicated | Validates only on submit (Join click or Enter), per spec — not while typing. Shows "That doesn't look like a valid email" or "An email has been sent!" inline next to the field. No backend: this is a client-only UX demo. |
| **Catalog filters — price range** (`FilterPanel`) | Neither bound can be negative · min can't exceed max | Both inputs get a red border and an inline error explaining exactly which rule failed the moment the range becomes invalid; clears itself the moment it's fixed. |
| **Catalog filters — genre / rating / in-stock** | N/A by construction | Checkboxes and a radio group can't represent an invalid state, so there's nothing to validate — this is deliberate, not an omission. |
| **Search** | N/A by construction | Free-text search accepts any string; there is no invalid query. |
| **Quantity stepper** (book details + cart drawer, one shared component) | Typed quantity clamps to `[1, stock]` | Clicking ± is always clamped silently since it can't go out of range by construction. *Typing* an out-of-range value (e.g. 999, or 0, or empty) commits the clamped value **and** shows why — "Only N left in stock" or "Quantity must be at least 1" — instead of silently correcting it. The message clears on the next edit. |
| **Cart quantity vs. stock** (checkout time) | Server re-checks stock inside the order transaction | If stock changed between adding to cart and checkout, the order is rejected (409) and rolled back rather than overselling. |

## Design decisions and assumptions

- **Fully offline.** Fraunces and Inter are self-hosted woff2 files and all 60 cover images are committed to the repo, so nothing is fetched from the network at runtime.
- **`node:sqlite` over a driver package.** Zero dependencies, zero node-gyp failures on the reviewer's machine. This is why Node 22+ is required.
- **All design values are tokens.** `client/src/theme.css` is the single source of every color, radius, shadow, font size, and spacing value. Component CSS only references `var(--*)`. Dark mode is a second token set on `[data-theme="dark"]`.
- **Filter state lives in the URL.** Searches and filters are shareable and survive refresh and the back button.
- **Checkout validation assumptions** (India): phone is exactly 10 digits, PIN code is exactly 6 digits. See the [Form validation](#form-validation) section above for the full picture across every form.
- **Stock is enforced twice.** The UI clamps quantities to available stock, and the server rejects (409, transaction rolled back) any order that exceeds it.
- **Rate limiting** is a small fixed-window in-memory middleware (300 requests/min per IP), which is appropriate for a single-process local app.
- **Prices are in INR** with a flat mock 5% tax at checkout.
- Book metadata (titles, authors, ISBNs, covers) is real; ratings, prices, and stock are fabricated seed data.
- Cover images are fetched once at development time from Open Library and bundled. Six books are seeded out of stock on purpose to show that state.

## Accessibility

- Full keyboard support: the cart drawer and mobile filter sheet trap focus and close on Escape, and every interactive element has a visible `:focus-visible` outline.
- WCAG AA contrast in both themes, enforced by `pnpm check:contrast` (30 pairs, all held to 4.5:1).
- Semantic landmarks, labeled dialogs, `aria-live`-free forms with per-field error wiring, and `prefers-reduced-motion` support.
- Images use `loading="lazy"` inside fixed aspect-ratio boxes, so the layout never shifts.

## Responsive behavior

Mobile-first CSS with enhancements at 768px and 1024px:

- Below 768px: 2-column grid, full-width cart drawer, bottom-sheet filters, sticky add-to-cart bar on the details page, expandable header search.
- 768 to 1023px: 3-column grid, 420px cart drawer.
- 1024px and up: sticky sidebar filters and a 4-column grid.
