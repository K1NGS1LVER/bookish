import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchBooks, type BookQuery } from "../api";
import { coverUrl } from "../api";
import { FilterChips } from "../components/catalog/FilterChips";
import { FilterPanel } from "../components/catalog/FilterPanel";
import { BookGrid } from "../components/catalog/BookGrid";
import { SortSelect } from "../components/catalog/SortSelect";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { useFetch, useFocusTrap, useScrollLock } from "../hooks";
import styles from "./HomePage.module.css";

const HERO_COVERS = [
  { isbn: "9780547928227", title: "The Hobbit" },
  { isbn: "9780441172719", title: "Dune" },
  { isbn: "9780062316097", title: "Sapiens" },
  { isbn: "9780141439518", title: "Pride and Prejudice" },
];

function useBookQuery(): [BookQuery, (patch: Partial<BookQuery>) => void, () => void] {
  const [params, setParams] = useSearchParams();

  const query = useMemo<BookQuery>(
    () => ({
      search: params.get("search") ?? "",
      genres: params.get("genres")?.split(",").filter(Boolean) ?? [],
      minPrice: params.get("minPrice") ?? "",
      maxPrice: params.get("maxPrice") ?? "",
      minRating: params.get("minRating") ?? "",
      inStock: params.get("inStock") === "1",
      sort: params.get("sort") ?? "relevance",
    }),
    [params]
  );

  const patch = useCallback(
    (p: Partial<BookQuery>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const merged = { ...query, ...p };
          const setOrDelete = (key: string, val: string) =>
            val ? next.set(key, val) : next.delete(key);
          setOrDelete("search", merged.search ?? "");
          setOrDelete("genres", (merged.genres ?? []).join(","));
          setOrDelete("minPrice", merged.minPrice ?? "");
          setOrDelete("maxPrice", merged.maxPrice ?? "");
          setOrDelete("minRating", merged.minRating ?? "");
          setOrDelete("inStock", merged.inStock ? "1" : "");
          setOrDelete("sort", merged.sort === "relevance" ? "" : merged.sort ?? "");
          return next;
        },
        { replace: true }
      );
    },
    [query, setParams]
  );

  const clear = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const key of ["genres", "minPrice", "maxPrice", "minRating", "inStock"]) {
          next.delete(key);
        }
        return next;
      },
      { replace: true }
    );
  }, [setParams]);

  return [query, patch, clear];
}

export function HomePage() {
  const [query, patch, clear] = useBookQuery();
  const { data: books, loading, error, retry } = useFetch(
    () => fetchBooks(query),
    JSON.stringify(query)
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  useFocusTrap(sheetRef, sheetOpen, closeSheet);
  useScrollLock(sheetOpen);

  const resultCount = books?.length ?? 0;

  return (
    <>
      <section className={styles.hero} id="top">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Chip>Independent bookstore, est. 2026</Chip>
            <h1 className={styles.heroTitle}>Find your next favorite book.</h1>
            <p className={styles.heroText}>
              Hand-picked shelves across six genres, honest prices, and zero
              algorithms judging your guilty pleasures.
            </p>
            <div className={styles.heroActions}>
              <Button size="lg" onClick={() => scrollToCatalog()}>
                Browse the shelves
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  patch({ sort: "rating" });
                  scrollToCatalog();
                }}
              >
                Today's picks
              </Button>
            </div>
          </div>
          <div className={styles.heroCovers} aria-hidden="true">
            {HERO_COVERS.map((c) => (
              <img
                key={c.isbn}
                src={coverUrl(c.isbn)}
                alt=""
                width="150"
                height="225"
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.catalog} id="catalog" aria-label="Book catalog">
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Filters</h2>
          <FilterPanel query={query} onChange={patch} onClear={clear} />
        </aside>

        <div className={styles.results}>
          <div className={styles.toolbar}>
            <h2 className={styles.resultsTitle}>
              {query.search ? `Results for “${query.search}”` : "The shelves"}
              {!loading && (
                <span className={styles.count}> · {resultCount} book{resultCount === 1 ? "" : "s"}</span>
              )}
            </h2>
            <div className={styles.toolbarActions}>
              <button
                type="button"
                className={styles.filtersBtn}
                onClick={() => setSheetOpen(true)}
              >
                Filters
              </button>
              <SortSelect
                value={query.sort ?? "relevance"}
                onChange={(sort) => patch({ sort })}
              />
            </div>
          </div>

          <FilterChips query={query} onChange={patch} />

          {error ? (
            <div className={styles.error} role="alert">
              <p>{error}</p>
              <Button variant="ghost" onClick={retry}>
                Try again
              </Button>
            </div>
          ) : (
            <BookGrid books={books ?? []} loading={loading} />
          )}
        </div>
      </section>

      {sheetOpen && (
        <div className={styles.sheetRoot}>
          <div
            className={styles.sheetOverlay}
            onClick={closeSheet}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div className={styles.sheetHead}>
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
          </div>
        </div>
      )}
    </>
  );
}

function scrollToCatalog() {
  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
}
