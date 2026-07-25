# Motion/Animation Library Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's plain CSS-keyframe interactions (cart drawer, mobile filter sheet, catalog grid, add-to-cart feedback, related-books row, global scroll) with `motion`-driven, accessible, tokenized animations, add a real icon library, and grow the seeded catalog to 60 books.

**Architecture:** `motion` (formerly framer-motion) is the workhorse for every in-page/component animation (drawer/sheet enter+exit, staggered grid entrance, layout reflow on filter change, tap feedback). `embla-carousel-react` replaces the plain scroll row for "More like this" only. `sonner` replaces the button-label-swap add-to-cart feedback with a toast. `lucide-react` replaces hand-rolled inline SVG icons. `lenis` wraps the whole app for smoothed scroll, in `root` mode only (no wrapper/content refs, to avoid breaking the app's several `position: sticky` elements). The already-built, already-verified View Transitions API route morph (catalog grid → book details) is explicitly untouched by every task in this plan.

**Tech Stack:** React 18.3, TypeScript, Vite, react-router-dom 6.28, Zustand 5. New: `motion`, `embla-carousel-react`, `sonner`, `lucide-react`, `lenis`.

## Global Constraints

- **Every CSS value is tokenized in `client/src/theme.css`.** Component CSS modules only ever reference `var(--*)`. Every new animation timing/easing is a new theme.css token — never a magic number inside a `.module.css` file. Exception, stated explicitly per task: gesture-physics values (drag-dismiss pixel/velocity thresholds, Lenis's internal scroll-physics config) are not CSS timings and are not tokenized.
- **Fully offline at runtime.** All five new packages are bundled by Vite at build time. Never add code that fetches from a CDN or external URL at runtime.
- **WCAG AA is enforced by `scripts/check-contrast.mjs`, which only parses `client/src/theme.css`.** Any new visible UI (the sonner Toaster) must be styled using only existing `var(--*)` tokens already in that file — never a library's own built-in color palette (e.g. sonner's `richColors`), or the audit cannot see it and a contrast regression could ship undetected.
- **`prefers-reduced-motion` must be respected everywhere new motion is added**, not just where CSS already handles it globally. The existing blanket rule in `theme.css` (`*, *::before, *::after { animation-duration: 0.01ms !important; ... }`) does not reach JS-driven libraries (`motion`, `lenis`, `embla-carousel-react`) — every task that adds an animation must explicitly branch on `usePrefersReducedMotion()` (built in Task 1) at the point that animation is triggered.
- **Do not regress existing accessibility work.** The cart drawer and mobile filter sheet already have a working focus trap (`useFocusTrap`) and scroll lock (`useScrollLock`), both in `client/src/hooks.ts`, and `aria-modal`/`role="dialog"` wiring. Every task touching these components must keep all of this working identically — verify, don't assume.
- **Never touch `server/` or `shared/`** except in Task 9 (catalog expansion), which only touches `server/seed/books.json` and `server/test/api.test.ts`.
- **Never modify or duplicate `client/src/hooks.ts`'s `useTransitionNavigate`/`useTransitionLinkClick`, or the `::view-transition-*` CSS in `theme.css`.** This is the already-built, already-verified catalog→book-details shared-element morph. No task in this plan touches it; several tasks must verify it still works after their change.
- **Package installs are client-only**: `pnpm --filter client add <package>` (or run from `client/`). Never add these to `server/package.json` or `shared/package.json`.
- **This app has no client-side test runner** (by design — UI/interaction correctness in this codebase is verified live in a real browser via Playwright driving the dev server, matching how every prior UI change this session was verified, not via a new jsdom/vitest client setup). Do not add one. Each task's verification step is a live Playwright check against `pnpm dev`, screenshotted, with concrete assertions — not a unit test file. The one exception is Task 9, which touches `server/test/api.test.ts` (the existing server-side Vitest suite).
- **Tasks 2 through 9 are independent of each other** once Task 1 is complete — they touch disjoint files and can be implemented/reviewed in any order. Task 1 must run first; everything else depends on the tokens and helpers it produces.

---

### Task 1: Motion foundations — dependencies, tokens, shared helpers, reduced-motion hook

**Files:**
- Modify: `client/package.json`
- Modify: `client/src/theme.css`
- Create: `client/src/motion.ts`
- Modify: `client/src/hooks.ts`

**Interfaces:**
- Produces (used by every later task):
  - theme.css tokens: `--duration-drawer`, `--duration-card-enter`, `--stagger-step`, `--duration-grid-layout`, `--duration-tap`, `--scale-tap` — and removes `--ease-drawer` (dead after Tasks 2/3 delete its only consumers).
  - `client/src/motion.ts` exports: `EASE: readonly [number, number, number, number]`, `drawerTransition(): Transition`, `overlayVariants: Variants`, `panelVariantsX: Variants`, `panelVariantsY: Variants`, `gridItemVariants: Variants`, `cardEnterTransition(): Transition`, `layoutTransition(): Transition`, `tapTransition(): Transition`, `tapScale(): number`, `staggerTransition(): { staggerChildren: number }`.
  - `client/src/hooks.ts` new export: `usePrefersReducedMotion(): boolean`.

  Every export in `motion.ts` is consumed by at least one later task — `overlayVariants`/`panelVariantsX` by Task 2, `panelVariantsY` by Task 3 (which also reuses `overlayVariants`, not a separate inline copy), `gridItemVariants`/`cardEnterTransition`/`layoutTransition`/`staggerTransition` by Task 4, `tapTransition`/`tapScale` by Task 5. If you find yourself hand-rolling a `getComputedStyle`/CSS-var read anywhere outside `motion.ts`, stop — add a named helper to `motion.ts` instead and import it, matching this pattern exactly.

- [ ] **Step 1: Install the five new packages**

Run from the repo root:
```bash
pnpm --filter client add motion embla-carousel-react sonner lucide-react lenis
```
Expected: `client/package.json` `dependencies` gains `motion`, `embla-carousel-react`, `sonner`, `lucide-react`, `lenis`. `pnpm-lock.yaml` updates. No devDependency changes needed — all five ship their own TypeScript types.

- [ ] **Step 2: Verify the exact import paths against what actually installed**

```bash
node -e "console.log(require('motion/package.json').exports)" 2>/dev/null || cat client/node_modules/motion/package.json | grep -A 20 '"exports"'
cat client/node_modules/lenis/package.json | grep -A 20 '"exports"'
```
Confirm `motion/react` and `lenis/react` are real exported subpaths (this plan assumes `import { motion, AnimatePresence, MotionConfig, useDragControls } from "motion/react"` and `import { ReactLenis, useLenis } from "lenis/react"` — **not** `framer-motion` or `@studio-freight/react-lenis`, both superseded). If either subpath doesn't exist in the installed version, stop and report — do not silently substitute a different import path without flagging it, later tasks assume these exact paths.

- [ ] **Step 3: Add new theme.css tokens, remove the one being replaced**

In `client/src/theme.css`, in the existing `/* Motion */` block (currently containing `--duration-fast`, `--ease-fast`, `--ease-drawer`, `--ease-page`, `--duration-page`), replace it with:

```css
  /* Motion */
  --duration-fast: 160ms;
  --ease-fast: var(--duration-fast) ease;
  --ease-page: cubic-bezier(0.22, 1, 0.36, 1); /* ease-out-quint: no bounce */
  --duration-page: 420ms;
  --duration-drawer: 250ms;
  --duration-card-enter: 280ms;
  --stagger-step: 40ms;
  --duration-grid-layout: 350ms;
  --duration-tap: 100ms;
  --scale-tap: 0.96;
```

This deletes `--ease-drawer: 250ms ease-out;`. Do not delete it yet if any `.module.css` file still references it — Tasks 2 and 3 delete those references as part of their own work. If you're implementing this task standalone, run:
```bash
grep -rn "ease-drawer" client/src
```
and confirm the only matches are in `CartDrawer.module.css` and `HomePage.module.css` (both `.overlay`/`.panel`/`.sheetOverlay`/`.sheet` `animation:` declarations) — those are deleted by Tasks 2/3, not this task. Leaving `--ease-drawer` deleted here means those two files will reference an undefined CSS variable until Tasks 2/3 land; that's expected and harmless (an undefined `var()` just falls back to nothing, no build error) but note it so the controller doesn't mistake it for a bug.

- [ ] **Step 4: Create `client/src/motion.ts`**

```ts
import type { Transition, Variants } from "motion/react";

function cssSeconds(varName: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseFloat(raw) / 1000;
}

function cssNumber(varName: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseFloat(raw);
}

/** Ease-out-quint, no bounce — mirrors --ease-page in theme.css. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export function drawerTransition(): Transition {
  return { duration: cssSeconds("--duration-drawer"), ease: EASE };
}

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const panelVariantsX: Variants = {
  hidden: { x: "100%" },
  show: { x: 0 },
};

export const panelVariantsY: Variants = {
  hidden: { y: "100%" },
  show: { y: 0 },
};

export const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function cardEnterTransition(): Transition {
  return { duration: cssSeconds("--duration-card-enter"), ease: EASE };
}

export function layoutTransition(): Transition {
  return { duration: cssSeconds("--duration-grid-layout"), ease: EASE };
}

export function tapTransition(): Transition {
  return { duration: cssSeconds("--duration-tap") };
}

export function tapScale(): number {
  return cssNumber("--scale-tap");
}

export function staggerTransition(): { staggerChildren: number } {
  return { staggerChildren: cssSeconds("--stagger-step") };
}
```

Every function reads its CSS variable lazily, at call time (inside a component's render or event handler), never at module load — `theme.css` is guaranteed applied by the time any component renders, but not necessarily by the time this module is first imported/evaluated.

- [ ] **Step 5: Add `usePrefersReducedMotion` to `client/src/hooks.ts`**

Add this export (near the other hooks, e.g. after `useTheme`):

```ts
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```

`useState`/`useEffect` are already imported in this file (used by other hooks) — no new imports needed for this step.

- [ ] **Step 6: Typecheck and build**

```bash
pnpm --filter client build
```
Expected: `tsc --noEmit && vite build` completes with no errors. `motion.ts` and the new hook aren't consumed by anything yet, so this only proves they compile in isolation — that's sufficient for this task.

- [ ] **Step 7: Commit**

```bash
git add client/package.json pnpm-lock.yaml client/src/theme.css client/src/motion.ts client/src/hooks.ts
git commit -m "feat: add motion/embla/sonner/lucide/lenis deps and shared motion tokens"
```

---

### Task 2: CartDrawer — animated open/close via motion

**Files:**
- Modify: `client/src/components/cart/CartDrawer.tsx`
- Modify: `client/src/components/cart/CartDrawer.module.css`

**Interfaces:**
- Consumes (from Task 1): `drawerTransition`, `overlayVariants`, `panelVariantsX` from `client/src/motion.ts`; `usePrefersReducedMotion` from `client/src/hooks.ts`.
- Consumes (unchanged, already exists): `useFocusTrap`, `useScrollLock` from `client/src/hooks.ts`; `useCart` from `client/src/store/cartStore.ts`.
- Produces: nothing new — `CartDrawer`'s external behavior (mounted unconditionally in `App.tsx`, driven by Zustand `isOpen`) is unchanged.

- [ ] **Step 1: Read the current file to get exact current content**

```bash
cat client/src/components/cart/CartDrawer.tsx
```

- [ ] **Step 2: Replace the hard unmount with `AnimatePresence`**

At the top of `CartDrawer.tsx`, add imports:
```tsx
import { AnimatePresence, motion } from "motion/react";
import { drawerTransition, overlayVariants, panelVariantsX } from "../../motion";
import { usePrefersReducedMotion } from "../../hooks";
```

Inside the component, add near the top (with the other hooks already called there):
```tsx
const reducedMotion = usePrefersReducedMotion();
```

Remove the line `if (!isOpen) return null;`. Move any calculations that were below it (e.g. `const { subtotal } = cartTotals(...)`) so they still run unconditionally — they're cheap even when closed, and moving them above where the early return used to be keeps the component's logic order intact.

Wrap the entire existing returned JSX (the `<div className={styles.root}>...</div>` tree) like this:

```tsx
return (
  <AnimatePresence>
    {isOpen && (
      <div className={styles.root}>
        <motion.div
          className={styles.overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="show"
          exit="hidden"
          transition={reducedMotion ? { duration: 0 } : drawerTransition()}
          onClick={closeDrawer}
          aria-hidden="true"
        />
        <motion.div
          ref={panelRef}
          className={styles.panel}
          variants={panelVariantsX}
          initial="hidden"
          animate="show"
          exit="hidden"
          transition={reducedMotion ? { duration: 0 } : drawerTransition()}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          {/* everything that was already inside .panel stays exactly as-is */}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
```

`panelRef` is the same ref already passed to `useFocusTrap(panelRef, isOpen, closeDrawer)` earlier in the component — do not create a new ref, reuse the existing one. `motion.div` forwards refs to its underlying DOM node natively, so `useFocusTrap`'s `querySelectorAll` calls against `panelRef.current` keep working unchanged.

`useFocusTrap(panelRef, isOpen, closeDrawer)` and `useScrollLock(isOpen)` stay exactly where they already are in the component (called unconditionally, before any return) — do not move them inside the conditional block.

- [ ] **Step 3: Delete the now-dead CSS keyframe animations**

In `CartDrawer.module.css`, delete:
- `@keyframes fade-in { ... }`
- `@keyframes slide-in { ... }`
- The `animation: fade-in var(--ease-drawer);` declaration on `.overlay`
- The `animation: slide-in var(--ease-drawer);` declaration on `.panel`

Leave every other rule in the file (`.root`, `.overlay`'s `position`/`inset`/`background`, `.panel`'s `position`/`width`/`background`/etc., and everything below it) untouched — `motion` now drives the enter/exit transform and opacity, but the static positioning/sizing/color CSS is unchanged.

- [ ] **Step 4: Typecheck and build**

```bash
pnpm --filter client build
```
Expected: no errors.

- [ ] **Step 5: Live verification via Playwright**

Start the dev server and drive it:
```bash
pnpm dev &
sleep 3
```
Then run a Playwright script (adapt the pattern already used elsewhere in this session — launch chromium, open the app, navigate) that:
1. Opens the cart drawer (click the header cart icon) and screenshots — confirm the panel is visible, slid fully into view (not mid-animation, wait ~400ms after the click).
2. Screenshots ~100ms after clicking the close (×) button — confirm the panel is partway through its exit slide (not instantly gone), proving the exit animation actually plays rather than an instant unmount.
3. Waits out the animation, screenshots again — confirm the drawer is fully gone from the DOM (query for `[role="dialog"][aria-label="Shopping cart"]`, expect it not found).
4. Reopens the drawer, presses Tab repeatedly, confirms focus stays within the panel (doesn't escape to page content behind it).
5. Presses Escape, confirms the drawer closes and focus returns to the cart icon button.
6. Confirms body scroll is locked while the drawer is open (`document.body.style.overflow` is `"hidden"`) and restored after it fully closes.
7. Re-run with the browser context created via `reducedMotion: 'reduce'` (Playwright `newContext({ reducedMotion: 'reduce' })`): repeat steps 1-3, confirm the drawer opens/closes with no perceptible animation delay (the `{ duration: 0 }` branch).

Kill the dev server after: `pkill -f "vite"` (or use the port-kill pattern: `lsof -ti:5173,5174,5175 -sTCP:LISTEN | xargs -r kill`, checking which port Vite actually bound to in its output first).

Expected: all of the above pass with zero console errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/cart/CartDrawer.tsx client/src/components/cart/CartDrawer.module.css
git commit -m "feat(cart): animate drawer open/close with motion"
```

---

### Task 3: Mobile filter sheet — animated open/close + drag-to-dismiss via motion

**Files:**
- Modify: `client/src/pages/HomePage.tsx`
- Modify: `client/src/pages/HomePage.module.css`

**Interfaces:**
- Consumes (from Task 1): `drawerTransition`, `overlayVariants`, `panelVariantsY` from `client/src/motion.ts`; `usePrefersReducedMotion` from `client/src/hooks.ts`.
- Consumes (unchanged, already exists): `useFocusTrap`, `useScrollLock` from `client/src/hooks.ts`.
- Produces: nothing new — the sheet's external trigger (the "Filters" button, `sheetOpen` state) is unchanged.

- [ ] **Step 1: Read the current file to get exact current content**

```bash
grep -n "sheetOpen\|sheetRef\|closeSheet" client/src/pages/HomePage.tsx
sed -n '160,210p' client/src/pages/HomePage.tsx
```
(Or use a file-reading tool if `sed` is unavailable/aliased in your shell — the relevant block is the `{sheetOpen && (...)}` conditional render, roughly lines 173-204.)

- [ ] **Step 2: Add imports and the reduced-motion hook call**

At the top of `HomePage.tsx`, add:
```tsx
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { drawerTransition, overlayVariants, panelVariantsY } from "../motion";
```
(`usePrefersReducedMotion` is likely already imported if Task 2 already ran and touched a shared import line — check `client/src/hooks.ts`'s existing import in this file and add `usePrefersReducedMotion` to it if not already present.)

Inside the `HomePage` component function, near where `sheetOpen`/`sheetRef`/`closeSheet` are already defined, add:
```tsx
const reducedMotion = usePrefersReducedMotion();
const dragControls = useDragControls();
```

- [ ] **Step 3: Wrap the sheet in `AnimatePresence`, add drag-to-dismiss**

Replace the `{sheetOpen && (<div className={styles.sheetRoot}>...)}` block with:

```tsx
<AnimatePresence>
  {sheetOpen && (
    <div className={styles.sheetRoot}>
      <motion.div
        className={styles.sheetOverlay}
        variants={overlayVariants}
        initial="hidden"
        animate="show"
        exit="hidden"
        transition={reducedMotion ? { duration: 0 } : drawerTransition()}
        onClick={closeSheet}
        aria-hidden="true"
      />
      <motion.div
        ref={sheetRef}
        className={styles.sheet}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          const DISMISS_PX = 120;
          const DISMISS_VELOCITY = 500;
          if (info.offset.y > DISMISS_PX || info.velocity.y > DISMISS_VELOCITY) {
            closeSheet();
          }
        }}
        variants={panelVariantsY}
        initial="hidden"
        animate="show"
        exit="hidden"
        transition={reducedMotion ? { duration: 0 } : drawerTransition()}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className={styles.sheetHead}>
          <span
            className={styles.grabber}
            aria-hidden="true"
            onPointerDown={(e) => dragControls.start(e)}
          />
          <h2>Filters</h2>
          <button
            type="button"
            className={styles.sheetClose}
            aria-label="Close filters"
            onClick={closeSheet}
          >
            ×
          </button>
        </div>
        <FilterPanel query={query} onChange={patch} onClear={clear} />
        <Button full size="lg" onClick={closeSheet}>
          Show {loading ? "…" : resultCount} book{resultCount === 1 ? "" : "s"}
        </Button>
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

`DISMISS_PX`/`DISMISS_VELOCITY` are gesture-physics thresholds, not CSS timings — per the Global Constraints, these are deliberately plain numbers in the component, not new theme.css tokens.

Only the new `.grabber` element primes the drag (via `onPointerDown` calling `dragControls.start(e)`) — the title and × button are not drag-initiators, so a normal tap on × cannot be swallowed by drag gesture recognition.

`sheetRef` is the same ref already passed to `useFocusTrap(sheetRef, sheetOpen, closeSheet)` — reuse it, don't create a new one. That hook call and `useScrollLock(sheetOpen)` stay exactly where they already are in the component, called unconditionally.

- [ ] **Step 4: Add the `.grabber` CSS**

In `HomePage.module.css`, add a new rule (near `.sheetHead`):
```css
.grabber {
  position: absolute;
  top: var(--space-2);
  left: 50%;
  transform: translateX(-50%);
  width: 2.5rem;
  height: 0.25rem;
  border-radius: var(--radius-pill);
  background: var(--border);
  cursor: grab;
}
```
`.sheetHead` needs `position: relative;` added if it doesn't already have it, so the grabber's `position: absolute` is positioned relative to the header row, not the whole sheet.

- [ ] **Step 5: Delete the now-dead CSS keyframe animations**

In `HomePage.module.css`, delete `@keyframes sheet-fade`, `@keyframes sheet-up`, and the `animation: sheet-fade ...` / `animation: sheet-up ...` declarations on `.sheetOverlay`/`.sheet`. Leave every other rule (positioning, sizing, colors, the `@media (min-width: 1024px) { .sheetRoot { display: none; } }` block) untouched.

- [ ] **Step 6: Typecheck and build**

```bash
pnpm --filter client build
```
Expected: no errors.

- [ ] **Step 7: Live verification via Playwright**

Resize the browser context to a mobile viewport (e.g. 390×844) and:
1. Click "Filters", screenshot after ~400ms — confirm the sheet is fully slid up.
2. Screenshot ~100ms after clicking × — confirm it's mid-exit (not instantly gone).
3. Reopen; simulate a drag on the `.grabber` element downward past 120px (Playwright `mouse.move`/`mouse.down`/`mouse.up` sequence, or `locator.dragTo`) — confirm the sheet dismisses and the closing motion continues smoothly from the dragged position rather than snapping back to closed-position-zero first. Screenshot mid-dismiss to check this visually.
4. Reopen; drag down only ~40px and release — confirm it springs back to fully open (not dismissed).
5. Confirm Escape and the × button both still close the sheet.
6. Confirm the focus trap still cycles Tab correctly with the drag handlers present (Tab through all filter controls, confirm it wraps).
7. Re-run with `reducedMotion: 'reduce'`: confirm open/close is near-instant.

Expected: all pass, zero console errors.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/HomePage.tsx client/src/pages/HomePage.module.css
git commit -m "feat(catalog): animate mobile filter sheet with motion, add swipe-to-dismiss"
```

---

### Task 4: BookGrid — staggered entrance + animated layout reflow on filter change

**Files:**
- Modify: `client/src/components/catalog/BookGrid.tsx`
- Modify: `client/src/components/catalog/BookGrid.module.css`

**Interfaces:**
- Consumes (from Task 1): `gridItemVariants`, `cardEnterTransition`, `layoutTransition`, `staggerTransition` from `client/src/motion.ts`.
- Consumes (unchanged): `BookCard` from `./BookCard`; the existing `loading`/`isFetching`/`data-fetching` mechanism already in this file (built earlier this session to fix a filter-change layout-shake bug — do not remove or bypass it).
- Produces: nothing new — `BookGrid`'s props (`books`, `loading`, `isFetching`) are unchanged.

**Why this task cannot reintroduce the filter-shake bug (read before starting):** earlier this session, changing a filter used to swap the grid to a fixed 8-card skeleton and back, causing two layout reflows in quick succession — visibly "shaking." The fix (already in place, untouched by this task) keeps showing the previous `books` data (dimmed via `data-fetching`) during a refetch instead of swapping to a skeleton. This task adds motion on top of that fix, not instead of it: existing cards get an animated *reflow* (`layout`) when their position changes, not a fresh fade-in — only genuinely new cards fade in. The `loading`-true branch (real skeleton, first load only) is untouched.

- [ ] **Step 1: Read the current file**

```bash
cat client/src/components/catalog/BookGrid.tsx
```

- [ ] **Step 2: Add imports**

```tsx
import { AnimatePresence, motion } from "motion/react";
import { cardEnterTransition, gridItemVariants, layoutTransition, staggerTransition } from "../../motion";
```

- [ ] **Step 3: Replace the populated-grid return with a staggered, layout-animated version**

Keep the `loading` branch (skeleton cards) and the empty-state branch exactly as they are today. Replace only the final `return` (the populated grid):

```tsx
return (
  <motion.div
    className={styles.grid}
    data-fetching={isFetching || undefined}
    aria-busy={isFetching || undefined}
    initial="hidden"
    animate="show"
    variants={{ hidden: {}, show: { transition: staggerTransition() } }}
  >
    <AnimatePresence mode="popLayout">
      {books.map((book) => (
        <motion.div
          key={book.id}
          layout
          variants={gridItemVariants}
          exit="hidden"
          transition={{ ...cardEnterTransition(), layout: layoutTransition() }}
        >
          <BookCard book={book} />
        </motion.div>
      ))}
    </AnimatePresence>
  </motion.div>
);
```

`staggerTransition()` (from `motion.ts`, added in Task 1) reads `--stagger-step` and returns `{ staggerChildren: number }` in seconds — call it inside the JSX as shown, it's cheap and only evaluated at render time, after `theme.css` is guaranteed applied.

The nested `layout: layoutTransition()` inside the item's `transition` prop is what gives the grid-reflow animation its own distinct duration (`--duration-grid-layout`, 350ms) separate from the enter/exit fade (`--duration-card-enter`, 280ms via `cardEnterTransition()`) — without this nested override, a single `transition` prop would apply the same duration to both, which is not what the two separate tokens were designed for. Do not flatten this back to a single transition object.

The parent `.grid` motion element itself only plays its own `hidden`→`show` transition once, when it first mounts (this never remounts across a filter change — same component instance for the lifetime of the page). Individual `motion.div` items that mount later (a filter reveals new cards) inherit the parent's current `"show"` animate state and play their own `hidden`→`show` transition on the `gridItemVariants`, staggered relative to each other via the parent's `staggerChildren` — but existing cards that were already showing don't restart or restagger; they only get the `layout` FLIP-reflow to their new grid position. This is the mechanism that keeps first-load feeling cascaded/lively while filter changes feel like a smooth reflow, not a repeated stagger show.

`mode="popLayout"` lets cards being removed exit without holding their grid slot open, so remaining `layout`-tracked cards animate into the freed space instead of jumping.

- [ ] **Step 4: Verify the wrapper doesn't change card sizing**

No new CSS needed in `BookGrid.module.css` — `motion.div` renders as a plain block-level `<div>` by default, which as a CSS grid item sizes identically to the plain `<div>`s it replaces. Confirm this visually in Step 5 rather than assuming.

- [ ] **Step 5: Typecheck, build, live verification**

```bash
pnpm --filter client build
```

Then, driving the dev server with Playwright:
1. Hard-navigate to `/`, screenshot at ~50ms, ~150ms, ~400ms after the initial catalog paint — confirm cards visibly cascade in (staggered), not all appear simultaneously.
2. Toggle a genre filter checkbox that reduces the result count substantially (e.g. filter to one genre). Screenshot immediately, at ~150ms, and settled — confirm: (a) no skeleton flash, (b) surviving cards glide smoothly to their new positions rather than snapping, (c) removed cards fade out rather than vanishing instantly, (d) the grid does not visibly jump/shake (this is the regression check for the earlier-session bug fix — compare card and sidebar Y-positions across frames, they should move smoothly, not jump discontinuously).
3. Clear the filter (back to all 48-or-60 books) — confirm newly-reappearing cards fade in without restaggering/refading the cards that stayed visible the whole time.
4. Re-run with `reducedMotion: 'reduce'`: confirm cards appear instantly with no visible stagger or glide (opacity/position settle immediately).

Expected: all pass, zero console errors, no layout-shake regression.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/catalog/BookGrid.tsx client/src/components/catalog/BookGrid.module.css
git commit -m "feat(catalog): stagger card entrance and animate grid reflow on filter change"
```

---

### Task 5: Add-to-cart feedback — sonner toast replaces button-label swap

**Files:**
- Modify: `client/src/components/catalog/BookCard.tsx`
- Modify: `client/src/components/catalog/BookCard.module.css`
- Modify: `client/src/pages/BookPage.tsx`
- Modify: `client/src/App.tsx`
- Create: `client/src/components/layout/Toaster.module.css`

**Interfaces:**
- Consumes (from Task 1): `tapTransition`, `tapScale` from `client/src/motion.ts`.
- Consumes (external): `toast`, `Toaster` from `"sonner"`.
- Consumes (unchanged): `useCart` from `client/src/store/cartStore.ts`; the cart badge pulse mechanism in `client/src/components/layout/Header.tsx` (do not touch — it already fires correctly from the store's `addCount`, regardless of which component called `add()`).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Read the current files**

```bash
cat client/src/components/catalog/BookCard.tsx
cat client/src/pages/BookPage.tsx
cat client/src/App.tsx
```

- [ ] **Step 2: Update `BookCard.tsx`**

Remove: the `justAdded` state, the `timer` ref, the `useEffect` that cleans up the timer, the `data-added={justAdded || undefined}` attribute, and the ternary that changes the button label to `"Added ✓"`.

Add imports:
```tsx
import { motion } from "motion/react";
import { toast } from "sonner";
import { tapScale, tapTransition } from "../../motion";
```

Replace `onAdd`:
```tsx
function onAdd() {
  add(book);
  toast.success(`Added "${book.title}" to cart`);
}
```

Replace the `<button className={styles.add} ...>` element with `<motion.button>`, keeping every existing prop, adding `whileTap`/`transition`, and simplifying the label (no more `justAdded` branch):
```tsx
<motion.button
  type="button"
  className={styles.add}
  disabled={out}
  whileTap={{ scale: tapScale() }}
  transition={tapTransition()}
  onClick={onAdd}
>
  {out ? "Notify me" : "Add"}
</motion.button>
```

- [ ] **Step 3: Delete the dead CSS in `BookCard.module.css`**

Remove the `.add[data-added] { background: var(--success); color: var(--bg-card); }` rule — `data-added` is never set anymore.

- [ ] **Step 4: Update `BookPage.tsx`**

In the `BookDetails` component, remove the same `justAdded` state/timer/cleanup pattern. Simplify `addLabel`:
```tsx
const addLabel = out ? "Out of stock" : "Add to cart";
```
Update `onAdd`:
```tsx
function onAdd() {
  add(book, qty);
  toast.success(`Added "${book.title}" to cart`);
  openDrawer();
}
```
Add the import: `import { toast } from "sonner";`

**Do not** add `whileTap`/`motion.button` treatment to this page's Add-to-cart buttons — they use the shared `Button` component (`client/src/components/ui/Button.tsx`), not a raw `<button>`. Changing `Button.tsx` itself is out of scope for this task (app-wide blast radius, unrequested); duplicating its markup here as a one-off `motion.button` is not worth it for a lower-frequency interaction that already gets the stronger "drawer opens" feedback. Leave both of this page's Add-to-cart `<Button>` usages exactly as they are otherwise.

- [ ] **Step 5: Mount the Toaster in `App.tsx`**

Add the import: `import { Toaster } from "sonner";` and `import toasterStyles from "./components/layout/Toaster.module.css";`

Add `<Toaster />` to the existing JSX tree (alongside `<CartDrawer />`, which is already mounted unconditionally there):
```tsx
<Toaster
  position="top-center"
  offset="5rem"
  toastOptions={{
    unstyled: true,
    classNames: {
      toast: toasterStyles.toast,
      title: toasterStyles.title,
      icon: toasterStyles.icon,
    },
  }}
/>
```
`offset="5rem"` clears the sticky header, matching the `5rem` sticky-offset convention already used three other places in this codebase (the desktop filter sidebar, the book-details cover panel — both `top: 5rem` in their respective `.module.css` files).

**Do not** pass sonner's `theme` prop or call `useTheme()` a second time here. `useTheme()` (in `client/src/hooks.ts`) is local `useState` per call site, not shared state — calling it again in `App.tsx` would create an independent copy that never updates when the user clicks the header's theme toggle, a real bug. The Toaster is styled entirely with `var(--*)` tokens (next step) that already flip automatically via the app's existing `[data-theme="dark"]` selector — no JS theme wiring needed.

- [ ] **Step 6: Create `client/src/components/layout/Toaster.module.css`**

```css
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--bg-card);
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-lift);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-meta);
}

.title {
  font-weight: 500;
}

.icon {
  color: var(--success);
}
```

Every value is an existing `var(--*)` token already present in `theme.css` — none are new, and none are sonner's own built-in palette, so `scripts/check-contrast.mjs` (which already audits `--ink` on `--bg-card`, per its existing pair list) continues to cover this new UI without any change to that script.

- [ ] **Step 7: Typecheck, build, run the contrast audit**

```bash
pnpm --filter client build
pnpm check:contrast
```
Expected: both succeed, contrast audit reports 0 failures (it re-parses the same `theme.css` pairs as always — this task added no new tokens, so the pair count is unchanged).

- [ ] **Step 8: Live verification via Playwright**

1. Click "Add" on a catalog grid card — confirm a toast appears reading exactly `Added "<title>" to cart` (use the real clicked book's title), the header cart badge pulses, and the button does a brief visible scale-down-then-back (no more "Added ✓" text ever appears).
2. Navigate to a book's details page, click "Add to cart" — confirm the toast appears, the cart drawer opens (existing behavior), and the button label is `"Out of stock"` only when actually out of stock, otherwise unchanged.
3. Confirm two rapid clicks on the same card produce two toasts (sonner stacks by default) — no crash, no duplicate-key console error.

Expected: all pass, zero console errors.

- [ ] **Step 9: Commit**

```bash
git add client/src/components/catalog/BookCard.tsx client/src/components/catalog/BookCard.module.css client/src/pages/BookPage.tsx client/src/App.tsx client/src/components/layout/Toaster.module.css
git commit -m "feat(cart): replace add-to-cart button label swap with a sonner toast"
```

---

### Task 6: "More like this" — embla carousel

**Files:**
- Create: `client/src/components/catalog/RelatedCarousel.tsx`
- Create: `client/src/components/catalog/RelatedCarousel.module.css`
- Modify: `client/src/pages/BookPage.tsx`
- Modify: `client/src/pages/BookPage.module.css`

**Interfaces:**
- Consumes (from Task 1): `usePrefersReducedMotion` from `client/src/hooks.ts`.
- Consumes (external): `useEmblaCarousel` (default export) from `"embla-carousel-react"`; `ChevronLeft`, `ChevronRight` from `"lucide-react"` (this task uses these two icons regardless of whether Task 7's broader icon swap has run yet — they're independent files).
- Consumes (unchanged): `BookCard` from `./BookCard`, used unmodified as slide content.
- Produces: `RelatedCarousel` component, default export, props `{ books: Book[] }` (import `Book` type from `"shared"`), consumed by `BookPage.tsx` in this same task.

**Explicitly out of scope**: the hero cover fan on `HomePage.tsx` is a static decorative stack (rotated, overlapping `<img>` elements), not a carousel — do not touch it in this task.

- [ ] **Step 1: Read the current related-books block in BookPage.tsx**

```bash
grep -n "relatedRow\|relatedItem\|More like this" client/src/pages/BookPage.tsx client/src/pages/BookPage.module.css
```

- [ ] **Step 2: Create `RelatedCarousel.tsx`**

```tsx
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import type { Book } from "shared";
import { usePrefersReducedMotion } from "../../hooks";
import { BookCard } from "./BookCard";
import styles from "./RelatedCarousel.module.css";

export function RelatedCarousel({ books }: { books: Book[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  return (
    <div className={styles.wrap}>
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.container}>
          {books.map((book) => (
            <div key={book.id} className={styles.slide}>
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Previous books"
        disabled={!canPrev}
        onClick={() => emblaApi?.scrollPrev(reducedMotion)}
        className={styles.arrowPrev}
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>
      <button
        type="button"
        aria-label="Next books"
        disabled={!canNext}
        onClick={() => emblaApi?.scrollNext(reducedMotion)}
        className={styles.arrowNext}
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </div>
  );
}
```

Before finalizing, confirm `scrollPrev`/`scrollNext` accept a boolean `jump` parameter in the installed `embla-carousel-react` version's types:
```bash
grep -n "scrollPrev\|scrollNext" client/node_modules/embla-carousel/components/*.d.ts 2>/dev/null || grep -rn "scrollPrev" client/node_modules/embla-carousel/esm/embla-carousel.esm.d.ts
```
If the signature differs (e.g. no boolean parameter in the installed version), drop the argument and instead skip calling `scrollPrev`/`scrollNext` under reduced motion in favor of directly jumping via `emblaApi.scrollTo(index, true)` — report which path was needed in the task's completion notes.

- [ ] **Step 3: Create `RelatedCarousel.module.css`**

```css
.wrap {
  position: relative;
}

.viewport {
  overflow: hidden;
}

.container {
  display: flex;
  gap: var(--space-4);
}

.slide {
  flex: 0 0 220px;
  min-width: 0;
}

.arrowPrev,
.arrowNext {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: background-color var(--ease-fast), opacity var(--ease-fast);
}

.arrowPrev:hover:not(:disabled),
.arrowNext:hover:not(:disabled) {
  background: var(--bg-sand);
}

.arrowPrev:disabled,
.arrowNext:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.arrowPrev {
  left: -1.25rem;
}

.arrowNext {
  right: -1.25rem;
}

@media (max-width: 639px) {
  .arrowPrev,
  .arrowNext {
    display: none;
  }
}
```
Arrows are hidden on narrow mobile viewports (touch-swipe is the primary interaction there, matching how the rest of this app already treats touch vs. pointer input) — the `.slide` sizing and drag/swipe behavior work identically with or without them.

`--space-4`, `--border`, `--radius-pill`, `--bg-card`, `--shadow`, `--bg-sand`, `--ease-fast` are all existing tokens already in `theme.css` — no new tokens needed for this task.

- [ ] **Step 4: Wire it into `BookPage.tsx`**

Add the import: `import { RelatedCarousel } from "../components/catalog/RelatedCarousel";`

Replace the existing inline `.relatedRow`/`.relatedItem` markup:
```tsx
{related.length > 0 && (
  <section className={styles.related} aria-label="More like this">
    <h2 className={styles.relatedTitle}>More like this</h2>
    <RelatedCarousel books={related} />
  </section>
)}
```

In `BookPage.module.css`, delete the now-unused `.relatedRow` and `.relatedItem` rules (their sizing convention — `flex: 0 0 220px` — was carried into `RelatedCarousel.module.css`'s `.slide` in Step 3). Leave `.related` and `.relatedTitle` as they are.

- [ ] **Step 5: Typecheck and build**

```bash
pnpm --filter client build
```
Expected: no errors.

- [ ] **Step 6: Live verification via Playwright**

1. Navigate to a book details page with related books, confirm the carousel renders with the correct book count as slides.
2. Confirm the "Previous" arrow is disabled at the start (scrolled to the first slide) and "Next" is enabled (if there are more slides than fit in the viewport).
3. Click "Next" — confirm the view scrolls by one slide-width and the button states update correctly (Previous becomes enabled).
4. Click through to the end — confirm "Next" becomes disabled at the last slide, no dead-end/infinite loop.
5. Tab to an arrow button via keyboard, press Enter — confirm it scrolls (keyboard operability).
6. Simulate a horizontal drag/swipe on the carousel viewport — confirm it scrolls and snaps to a slide boundary.
7. Confirm clicking a `BookCard` inside the carousel still navigates to that book's details page with the existing View Transitions morph intact (this is the regression check — carousel wrapping must not break the cover/title `viewTransitionName` wiring already on `BookCard`).

Expected: all pass, zero console errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/catalog/RelatedCarousel.tsx client/src/components/catalog/RelatedCarousel.module.css client/src/pages/BookPage.tsx client/src/pages/BookPage.module.css
git commit -m "feat(book): use embla-carousel for the More like this row"
```

---

### Task 7: Icon swap — lucide-react replaces hand-rolled inline SVGs

**Files:**
- Modify: `client/src/components/layout/Header.tsx`
- Modify: `client/src/components/catalog/FilterPanel.tsx`
- Modify: `client/src/components/checkout/FormField.tsx`

**Interfaces:**
- Consumes (external): `Search`, `Sun`, `Moon`, `ShoppingBag`, `CircleAlert` from `"lucide-react"`.
- Produces: nothing — pure visual swap, no prop/behavior changes to any component's external interface.

- [ ] **Step 1: Read the current icon markup in all three files**

```bash
grep -n "<svg" client/src/components/layout/Header.tsx client/src/components/catalog/FilterPanel.tsx client/src/components/checkout/FormField.tsx
```

- [ ] **Step 2: Replace icons in `Header.tsx`**

Add the import: `import { Moon, Search, ShoppingBag, Sun } from "lucide-react";`

Replace the inline `<svg>` magnifying-glass markup (both the main desktop search bar and the mobile toggle button, which reuse the same glyph) with:
```tsx
<Search aria-hidden="true" size={16} />
```
(Match the `width`/`height` the current SVG used at each call site — if one usage was `16` and the other `18`, preserve that per-usage sizing rather than forcing both to the same number.)

Replace the sun-icon markup (shown when `theme === "dark"`, to switch to light) with:
```tsx
<Sun aria-hidden="true" size={18} />
```
Replace the moon-icon markup (shown when `theme !== "dark"`) with:
```tsx
<Moon aria-hidden="true" size={18} />
```

Replace the cart bag icon markup with:
```tsx
<ShoppingBag aria-hidden="true" size={18} />
```

In every replacement, keep the exact same `aria-hidden="true"` placement as the SVG it replaces (all of these icons are decorative — the parent `<button>` already carries the real `aria-label`, unchanged by this task). Remove now-unused inline SVG `<path>`/`<circle>` markup entirely; don't leave commented-out dead code.

- [ ] **Step 3: Replace the duplicated error icon in `FilterPanel.tsx` and `FormField.tsx`**

Both files currently have an identical inline alert/error SVG (circle with "!" glyph). In `FilterPanel.tsx`, add the import `import { CircleAlert } from "lucide-react";` and replace that inline SVG with:
```tsx
<CircleAlert aria-hidden="true" size={13} />
```
In `FormField.tsx`, add the same import and make the identical replacement at its own (separately duplicated) copy of the same SVG.

Import `CircleAlert` independently in both files — do not create a new shared icon-wrapper component for this. Two `import` lines is not a duplication problem worth a new abstraction.

- [ ] **Step 4: Do not touch QuantityStepper**

`client/src/components/ui/QuantityStepper.tsx`'s `−`/`+` are plain text characters (`U+2212 MINUS SIGN` and `+`), not SVGs — leave them exactly as they are. No lucide `Minus`/`Plus` swap for this task; there's no reported visual-inconsistency issue and the buttons are already correctly `aria-label`'d regardless of glyph type.

- [ ] **Step 5: Typecheck and build**

```bash
pnpm --filter client build
```
Expected: no errors, no unused-import warnings (confirm every inline-SVG-only import that's no longer needed, if any, is removed).

- [ ] **Step 6: Live verification via Playwright**

Screenshot the header (both light and dark theme, via the theme toggle), the FilterPanel's price-range error state (enter an invalid range to trigger it), and the checkout form's field error state (submit with an invalid email) — compare each against the equivalent screenshot from before this task (if available in the session's prior screenshot history) or simply confirm visually that:
1. All icons render at a similar visual weight/size to what they replaced (no icon suddenly huge or tiny relative to its surrounding text/button).
2. The theme toggle correctly shows Sun in dark mode and Moon in light mode (same logic as before, only the glyph source changed).
3. No layout shift versus the previous inline-SVG version (buttons/inputs are the same size, icons are centered the same way).

Expected: all icons present, correctly sized, correct theme-conditional logic, zero console errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/layout/Header.tsx client/src/components/catalog/FilterPanel.tsx client/src/components/checkout/FormField.tsx
git commit -m "refactor: replace hand-rolled inline SVG icons with lucide-react"
```

---

### Task 8: Global Lenis smooth scroll

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/HomePage.tsx`

**Interfaces:**
- Consumes (from Task 1): `usePrefersReducedMotion` from `client/src/hooks.ts`.
- Consumes (external): `ReactLenis`, `useLenis` from `"lenis/react"`; `MotionConfig` from `"motion/react"`.
- Produces: nothing new for later tasks (this is the last app-shell-level change).

**Critical constraint, read before starting:** this app has four `position: sticky`/`fixed` elements — the header (`Header.tsx`), the desktop catalog filter sidebar (`HomePage.module.css`), the book-details sticky cover panel (`BookPage.module.css`), and the mobile sticky "buy bar" (`BookPage.module.css`). Lenis in its default `wrapper`/`content` mode applies a CSS `transform` to a wrapping div, which breaks `position: sticky`/`fixed` everywhere in that subtree (they become relative to the nearest transformed ancestor instead of the viewport). **You must use `<ReactLenis root>` with no `wrapper`/`content` options** — `root` mode smooths native `window.scrollTo` directly without any transform. Do not "simplify" this later without re-testing all four sticky elements.

- [ ] **Step 1: Read the current `App.tsx` and the hero CTA / hash-scroll code in `HomePage.tsx`**

```bash
cat client/src/App.tsx
grep -n "scrollToCatalog\|ScrollToTop\|scrollIntoView" client/src/App.tsx client/src/pages/HomePage.tsx client/src/components/layout/Header.tsx
```

- [ ] **Step 2: Update `App.tsx`**

Add imports:
```tsx
import { MotionConfig } from "motion/react";
import { ReactLenis, useLenis } from "lenis/react";
import { usePrefersReducedMotion } from "./hooks";
```

Update the `ScrollToTop` component (currently a bare `window.scrollTo(0, 0)` on every pathname change) to:
```tsx
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    if (hash) return; // let the #catalog hash-scroll effect (HomePage) handle this landing
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, lenis]);
  return null;
}
```
(`useLocation` is already imported in this file for the existing `pathname` read — extend the destructure to include `hash` too.)

Update the `App` component to wrap its existing returned shell:
```tsx
export function App() {
  const reducedMotion = usePrefersReducedMotion();
  const shell = (
    <ErrorBoundary>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          {/* existing routes, unchanged */}
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <Toaster /* existing props from Task 5, unchanged */ />
    </ErrorBoundary>
  );
  if (reducedMotion) {
    return <MotionConfig reducedMotion="user">{shell}</MotionConfig>;
  }
  return (
    <ReactLenis root options={{ autoRaf: true }}>
      <MotionConfig reducedMotion="user">{shell}</MotionConfig>
    </ReactLenis>
  );
}
```
Under reduced motion, `ReactLenis` is not mounted at all (not just configured to be inert) — zero residual smoothing, matching the same fallback pattern already used by `useTransitionNavigate` in `hooks.ts`.

- [ ] **Step 3: Rewire `scrollToCatalog` in `HomePage.tsx` through Lenis**

Find the existing module-level `scrollToCatalog()` function (currently `document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })`, used by the two hero CTA buttons). Replace it with an in-component callback:

```tsx
import { useLenis } from "lenis/react";
import { useLocation } from "react-router-dom"; // add useLocation to the existing react-router-dom import if not already present

// inside the HomePage component:
const lenis = useLenis();
const location = useLocation(); // may already exist if useSearchParams doesn't cover hash — check

const scrollToCatalog = useCallback(() => {
  const el = document.getElementById("catalog");
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el);
  } else {
    el.scrollIntoView({ behavior: "smooth" });
  }
}, [lenis]);

useEffect(() => {
  if (location.hash === "#catalog") {
    scrollToCatalog();
  }
}, [location.hash, scrollToCatalog]);
```

Replace both hero CTA buttons' `onClick={() => scrollToCatalog()}` (and the "Today's picks" button, which also calls it after setting a sort param) to call this new in-component `scrollToCatalog` instead of the deleted module-level function.

The `lenis ?? native` fallback inside `scrollToCatalog` naturally also covers the reduced-motion case: when `ReactLenis` isn't mounted (Step 2's `reducedMotion` branch), `useLenis()` returns `null`, so this silently falls back to the exact native call that already worked before this task.

- [ ] **Step 4: Verify the `.catalog { scroll-margin-top: 5rem }` offset still works with Lenis**

This is checked empirically in Step 5, not assumed. If `lenis.scrollTo(el)` lands short of or past the sticky header's height (ignoring `scroll-margin-top`), pass an explicit offset instead:
```tsx
lenis.scrollTo(el, { offset: -80 });
```
matching the same `5rem`-ish sticky-header-clearance convention already used elsewhere in this codebase (don't invent a different pixel value without checking what actually lines up visually).

- [ ] **Step 5: Typecheck, build, live verification via Playwright**

```bash
pnpm --filter client build
```

Then, driving the dev server:
1. Load `/`, scroll down and up with the mouse wheel — confirm scrolling feels smoothed (not a functional assertion, but confirm no console errors and the page responds to scroll input at all — Lenis silently failing to intercept would still show a working native-scroll page, so also explicitly check `window.scrollY` changes on wheel events via `page.mouse.wheel(...)`).
2. Confirm the sticky header stays pinned to the top while scrolling the page (screenshot at scroll position 0 and at scroll position 800px, header should be in the same screen position both times).
3. On desktop viewport, confirm the catalog filter sidebar stays pinned at its sticky offset while scrolling through a long results list.
4. On a book details page (desktop viewport), confirm the cover panel stays pinned while scrolling the description/details/related sections.
5. On mobile viewport, confirm the sticky bottom "buy bar" on a book details page stays pinned to the bottom of the viewport while scrolling.
6. Click "Browse the shelves" from the top of the home page — confirm it scrolls to the catalog section, landing with the catalog's heading clearly below (not obscured by) the sticky header.
7. Click "Today's picks" — same landing check, plus confirm the sort param was applied.
8. From a book details page, use the header search box to search for something — confirm it navigates to `/?search=...#catalog` and actually scrolls to the catalog section (this is the hash-scroll regression/improvement check — confirm it lands correctly, since this task made the hash-scroll explicit rather than relying on ambient browser behavior).
9. Test keyboard scrolling: focus the page body, press Page Down / Space / arrow-down repeatedly — confirm the page scrolls normally, not fighting or lagging against Lenis.
10. Re-run steps 1-8 with `reducedMotion: 'reduce'`: confirm Lenis is not mounted (check `window.lenis` is undefined, or that scroll behavior is indistinguishable from plain native scroll) and that hero-CTA/hash scrolling still works via the native fallback path.
11. Click a book cover to navigate to its details page — confirm the View Transitions shared-element morph (cover + title) still plays exactly as before this task; this plan touches no code in `useTransitionNavigate`/`useTransitionLinkClick`, but mounting Lenis/MotionConfig near the route tree makes a live re-check worthwhile.

Expected: all pass, zero console errors, all four sticky elements remain correctly pinned throughout.

- [ ] **Step 6: Commit**

```bash
git add client/src/App.tsx client/src/pages/HomePage.tsx
git commit -m "feat: add global Lenis smooth scroll, rewire hash-scroll through it"
```

---

### Task 9: Catalog expansion — 48 → 60 books

**Files:**
- Modify: `server/seed/books.json`
- Create: 12 new files in `client/public/covers/` (one `.jpg` per new book, named `{isbn}.jpg`)
- Modify: `server/test/api.test.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: 12 additional book entries in the seed data (2 per genre: Classics, Fantasy, Mystery, Non-fiction, Romance, Science Fiction — 10 each, 60 total), matching the existing schema exactly: `title, author, isbn, genre, price, rating, ratingCount, stock, description, pages, publisher, year` (no `id` field — assigned at DB insert time, same as all existing entries).

This task is independent of Tasks 1-8 (no shared files, no interface dependency) and can be done in parallel with any of them.

- [ ] **Step 1: Confirm current catalog state**

```bash
node -e "const b=require('./server/seed/books.json'); console.log('count:', b.length); const g={}; for(const x of b) g[x.genre]=(g[x.genre]||0)+1; console.log(g);"
```
Expected: `count: 48`, each genre showing `8`.

- [ ] **Step 2: Pick 12 real books, 2 per genre, not already in the seed**

Choose real, well-known titles not already present (check against the existing `title`/`author` values in `server/seed/books.json` first to avoid duplicates). For each, you need: title, author, a real ISBN, price/rating/ratingCount/stock (fabricated, matching the existing range conventions already visible in the file — prices roughly ₹250-₹600, ratings 3.9-4.9, ratingCount in the thousands, stock mostly 6-22 with 1-2 of the twelve deliberately set to `0` for realism, matching the existing pattern of a few out-of-stock books already in the seed), description (2-3 sentences, no spoilers, matching the existing entries' tone), pages, publisher, year.

- [ ] **Step 3: Verify a real cover exists for each ISBN before committing to it**

For each candidate, probe Open Library's direct ISBN cover endpoint first:
```bash
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" "https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg?default=false"
```
`200` with a size over ~2000 bytes means a real cover exists at that ISBN. A `302`/small-size response means it doesn't — fall back to Open Library's search API by title+author, preferring an English-language edition, using the pattern already established earlier this session:
```bash
curl -s "https://openlibrary.org/search.json?title={TITLE}&author={AUTHOR}&fields=title,isbn,cover_i,language&limit=15"
```
Pick a result with a `cover_i` and an `isbn`, preferring one where `language` includes `"eng"`, and use `https://covers.openlibrary.org/b/id/{cover_i}-L.jpg` to fetch the actual image (more reliable than guessing edition ISBNs).

- [ ] **Step 4: Download all 12 candidate covers to a scratch location and visually inspect them before committing**

Do not commit a cover without looking at it first — twice earlier this session, an automatically-selected "top match" turned out to be a study-guide/workbook cover (not the novel itself) or an omnibus/wrong-edition cover, and had to be replaced. Build a contact-sheet screenshot (an HTML grid of all 12 candidate images, rendered via a headless browser and screenshotted) and inspect it for: correct language (no foreign-language cover text), the actual novel (not a teacher's guide, workbook, or study companion), and the correct single edition (not a boxed-set/omnibus cover when only one book was requested).

- [ ] **Step 5: Commit accepted covers to `client/public/covers/`**

For each of the 12 accepted covers, save as `client/public/covers/{isbn}.jpg` using the exact `isbn` value that will go into the seed JSON entry.

- [ ] **Step 6: Add the 12 entries to `server/seed/books.json`**

Append the 12 new book objects to the JSON array (before the closing `]`), 2 per genre, matching the exact field schema of the existing 48 entries. Validate the file is syntactically correct JSON and has no duplicate ISBNs:
```bash
node -e "
const b = require('./server/seed/books.json');
console.log('count:', b.length);
const isbns = b.map(x => x.isbn);
console.log('duplicate isbns:', isbns.length - new Set(isbns).size);
const g = {};
for (const x of b) g[x.genre] = (g[x.genre] || 0) + 1;
console.log(g);
"
```
Expected: `count: 60`, `duplicate isbns: 0`, every genre showing `10`.

- [ ] **Step 7: Verify every seeded book has a matching cover file**

```bash
node -e "
const b = require('./server/seed/books.json');
const fs = require('fs');
const dir = './client/public/covers';
const missing = b.filter(x => !fs.existsSync(dir + '/' + x.isbn + '.jpg'));
console.log('missing covers:', missing.length);
missing.forEach(m => console.log(m.title));
"
```
Expected: `missing covers: 0`.

- [ ] **Step 8: Update the server test's hardcoded count**

In `server/test/api.test.ts`, find the test asserting `expect(res.body).toHaveLength(48)` (in the `"returns the seeded catalog"` test) and change it to `expect(res.body).toHaveLength(60)`.

- [ ] **Step 9: Reset the local dev database so it re-seeds from the updated JSON**

```bash
rm -f server/bookish.db
```
(The server auto-seeds on boot when this file is missing — no migration needed.)

- [ ] **Step 10: Run the full test suite**

```bash
rm -f server/bookish.db
pnpm -r test
```
Expected: all tests pass (the existing 21, with the one count assertion now checking 60).

- [ ] **Step 11: Update README.md**

Find and update the two "48 seeded titles" / "48 cover images" mentions to say 60.

- [ ] **Step 12: Final live check**

```bash
rm -f server/bookish.db
pnpm dev &
sleep 3
curl -s http://localhost:3001/api/books | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log('total:', JSON.parse(d).length))"
```
Expected: `total: 60`. Kill the dev server after (`lsof -ti:3001,5173,5174,5175 -sTCP:LISTEN | xargs -r kill`, checking the actual bound ports from the dev server's own log output first).

- [ ] **Step 13: Commit**

```bash
rm -f server/bookish.db
git add server/seed/books.json client/public/covers server/test/api.test.ts README.md
git commit -m "feat: expand catalog to 60 books (10 per genre)"
```
