import { motion } from "motion/react";
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

export function BookCard({ book }: { book: Book }) {
  const add = useCart((s) => s.add);
  const out = book.stock === 0;
  const bookHref = `/book/${book.id}`;
  const onNavigate = useTransitionLinkClick(bookHref);

  function onAdd() {
    add(book);
    toast.success(`Added "${book.title}" to cart`);
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
      </div>
    </article>
  );
}
