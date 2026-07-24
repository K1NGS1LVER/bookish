import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDebounced, useTheme } from "../../hooks";
import { cartCount, useCart } from "../../store/cartStore";
import styles from "./Header.module.css";

function SearchInput({ id }: { id: string }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [value, setValue] = useState(params.get("search") ?? "");
  const debounced = useDebounced(value, 300);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if ((current.get("search") ?? "") === debounced.trim()) return;
    if (debounced.trim()) current.set("search", debounced.trim());
    else current.delete("search");
    navigate(
      { pathname: "/", search: current.toString(), hash: "catalog" },
      { replace: true }
    );
  }, [debounced, navigate]);

  return (
    <div className={styles.search}>
      <svg
        className={styles.searchIcon}
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id={id}
        type="search"
        placeholder="Search by title, author, or ISBN…"
        aria-label="Search books"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export function Header() {
  const [theme, toggleTheme] = useTheme();
  const items = useCart((s) => s.items);
  const addCount = useCart((s) => s.addCount);
  const openDrawer = useCart((s) => s.openDrawer);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const count = cartCount(items);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={styles.header} data-scrolled={scrolled || undefined}>
      <div className={styles.inner}>
        <Link to="/" className={styles.wordmark}>
          Bookish<span className={styles.period}>.</span>
        </Link>

        <div className={styles.searchDesktop}>
          <SearchInput id="site-search" />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Toggle search"
            aria-expanded={mobileSearch}
            onClick={() => setMobileSearch((v) => !v)}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
              </svg>
            ) : (
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            onClick={openDrawer}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 7h12l-1.2 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            {count > 0 && (
              <span key={addCount} className={styles.badge} aria-hidden="true">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileSearch && (
        <div className={styles.searchMobile}>
          <SearchInput id="site-search-mobile" />
        </div>
      )}
    </header>
  );
}
