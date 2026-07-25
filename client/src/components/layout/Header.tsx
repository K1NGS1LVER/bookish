import { useEffect, useRef, useState, forwardRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Moon, Search, ShoppingBag, Sun } from "lucide-react";
import { useDebounced, useTheme } from "../../hooks";
import { cartCount, useCart } from "../../store/cartStore";
import styles from "./Header.module.css";

const SearchInput = forwardRef<HTMLInputElement, { id: string }>(
  function SearchInput({ id }, ref) {
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
        <Search aria-hidden="true" size={16} className={styles.searchIcon} />
        <input
          ref={ref}
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
);

export function Header() {
  const [theme, toggleTheme] = useTheme();
  const items = useCart((s) => s.items);
  const addCount = useCart((s) => s.addCount);
  const openDrawer = useCart((s) => s.openDrawer);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const count = cartCount(items);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileSearch) mobileSearchRef.current?.focus();
  }, [mobileSearch]);

  return (
    <header className={styles.header} data-scrolled={scrolled || undefined}>
      <div className={styles.inner}>
        <Link to="/" className={styles.wordmark} aria-label="Bookish home">
          <img
            className={styles.logoLarge}
            src="/logo.svg"
            alt=""
            width="160"
            height="40"
          />
          <img
            className={styles.logoSmall}
            src="/logo-small.svg"
            alt=""
            width="32"
            height="32"
          />
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
            <Search aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun aria-hidden="true" size={18} />
            ) : (
              <Moon aria-hidden="true" size={18} />
            )}
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            onClick={openDrawer}
          >
            <ShoppingBag aria-hidden="true" size={18} />
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
          <SearchInput id="site-search-mobile" ref={mobileSearchRef} />
        </div>
      )}
    </header>
  );
}
