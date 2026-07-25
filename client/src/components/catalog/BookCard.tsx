import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatPrice, type Book } from "shared";
import { useTransitionLinkClick } from "../../hooks";
import { tapScale, tapTransition } from "../../motion";
import { useCart } from "../../store/cartStore";
import { Chip } from "../ui/Chip";
import { CoverImage } from "../ui/CoverImage";
import { RatingStars } from "../ui/RatingStars";
import styles from "./BookCard.module.css";

const ADDED_FLASH_MS = 1400;

export function BookCard({ book }: { book: Book }) {
  const add = useCart((s) => s.add);
  const out = book.stock === 0;
  const bookHref = `/book/${book.id}`;
  const onNavigate = useTransitionLinkClick(bookHref);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  function onAdd() {
    add(book);
    toast.success(`Added "${book.title}" to cart`);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), ADDED_FLASH_MS);
  }

  function onNotify() {
    toast.success(`We'll email you when "${book.title}" is back in stock`);
  }

  return (
    <article className={styles.card} data-out={out || undefined}>
      <Link to={bookHref} className={styles.coverLink} onClick={onNavigate}>
        <span className={styles.genreChip}>
          <Chip>{book.genre}</Chip>
        </span>
        <CoverImage
          isbn={book.isbn}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          width={220}
          height={330}
          className={styles.cover}
          style={{ viewTransitionName: `book-cover-${book.id}` }}
        />
      </Link>
      <h3 className={styles.title} style={{ viewTransitionName: `book-title-${book.id}` }}>
        <Link to={bookHref} onClick={onNavigate}>{book.title}</Link>
      </h3>
      <p className={styles.author}>{book.author}</p>
      <RatingStars rating={book.rating} count={book.ratingCount} />
      <div className={styles.priceRow}>
        <span className={styles.price}>{formatPrice(book.price)}</span>
        {out ? (
          <button type="button" className={styles.notify} onClick={onNotify}>
            Notify me
          </button>
        ) : (
          <motion.button
            type="button"
            className={styles.add}
            data-added={added || undefined}
            aria-label={added ? `Added "${book.title}" to cart` : `Add "${book.title}" to cart`}
            whileTap={{ scale: tapScale() }}
            transition={tapTransition()}
            onClick={onAdd}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="check"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={tapTransition()}
                  className={styles.addIcon}
                >
                  <Check aria-hidden="true" size={16} />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={tapTransition()}
                  className={styles.addIcon}
                >
                  <Plus aria-hidden="true" size={16} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </article>
  );
}
