import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";

export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export interface Fetched<T> {
  data: T | null;
  /** True only while there is no data to show yet (first load). */
  loading: boolean;
  /** True whenever a request is in flight, including background refetches. */
  isFetching: boolean;
  error: string | null;
  retry: () => void;
}

/** Refetches on key change; keeps stale data visible during background fetches
 *  so filtered grids don't flash-jump between skeleton sizes. */
export function useFetch<T>(fn: () => Promise<T>, key: string): Fetched<T> {
  const [data, setData] = useState<T | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setIsFetching(true);
    setError(null);
    fnRef
      .current()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setIsFetching(false);
      });
    return () => {
      alive = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data, loading: isFetching && data === null, isFetching, error, retry };
}

export function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? "light"
  );
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("bookish-theme", next);
      return next;
    });
  }, []);
  return [theme, toggle];
}

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

/** Trap Tab focus inside `ref` while `active`; call `onClose` on Escape. */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onClose: () => void
): void {
  useEffect(() => {
    if (!active || !ref.current) return;
    const node = ref.current;
    const prevFocus = document.activeElement as HTMLElement | null;

    const focusables = () =>
      [...node.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )].filter((el) => !el.hasAttribute("disabled"));

    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [ref, active, onClose]);
}

// Progressive enhancement: morphs shared viewTransitionName elements between routes.
// Falls back to plain navigate when the API is missing or reduced motion is preferred.
export function useTransitionNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: string) => {
      const supported = typeof document.startViewTransition === "function";
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (!supported || reduceMotion) {
        navigate(to);
        return;
      }
      document.startViewTransition(() => {
        flushSync(() => navigate(to));
      });
    },
    [navigate]
  );
}

// Lets cmd/ctrl/shift/middle-click pass through for "open in new tab".
export function useTransitionLinkClick(to: string) {
  const navigateWithTransition = useTransitionNavigate();
  return useCallback(
    (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      e.preventDefault();
      navigateWithTransition(to);
    },
    [navigateWithTransition, to]
  );
}

/** Lock body scroll while a drawer/sheet is open. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Set document.title and standard meta tags on mount, restore on unmount. */
export function useHead(opts: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  useEffect(() => {
    const prev = document.title;
    const meta = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(
        `meta[property="${name}"], meta[name="${name}"]`
      );
      if (!el) {
        el = document.createElement("meta");
        if (name.startsWith("og:") || name.startsWith("twitter:")) {
          el.setAttribute("property", name);
        } else {
          el.setAttribute("name", name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    const prevMetas: { el: HTMLMetaElement; attr: string; val: string }[] = [];
    const setMeta = (name: string, content: string) => {
      const el = document.querySelector<HTMLMetaElement>(
        `meta[property="${name}"], meta[name="${name}"]`
      );
      const attr = el?.hasAttribute("property") ? "property" : "name";
      const prevEl = el
        ? { el, attr, val: el.getAttribute(attr) ?? "" }
        : null;
      meta(name, content);
      if (prevEl) prevMetas.push(prevEl);
    };

    if (opts.title) document.title = opts.title;
    if (opts.description) meta("description", opts.description);
    if (opts.title) meta("og:title", opts.title);
    if (opts.description) meta("og:description", opts.description);
    if (opts.image) meta("og:image", opts.image);
    if (opts.url) meta("og:url", opts.url);
    if (opts.type) meta("og:type", opts.type);

    return () => {
      document.title = prev;
      for (const m of prevMetas) {
        m.el.setAttribute(m.attr, m.val);
      }
    };
  }, [opts.title, opts.description, opts.image, opts.url, opts.type]);
}
