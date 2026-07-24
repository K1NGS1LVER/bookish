import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, type Book } from "shared";
import { coverUrl } from "../../api";
import { useCart } from "../../store/cartStore";
import { Chip } from "../ui/Chip";
import { RatingStars } from "../ui/RatingStars";
import styles from "./BookCard.module.css";

export function BookCard({ book }: { book: Book }) {
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const out = book.stock === 0;

  useEffect(() => () => clearTimeout(timer.current), []);

  function onAdd() {
    add(book);
    setJustAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <article className={styles.card} data-out={out || undefined}>
      <Link to={`/book/${book.id}`} className={styles.coverLink}>
        <span className={styles.genreChip}>
          <Chip>{book.genre}</Chip>
        </span>
        <img
          className={styles.cover}
          src={coverUrl(book.isbn)}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          width="220"
          height="330"
        />
      </Link>
      <h3 className={styles.title}>
        <Link to={`/book/${book.id}`}>{book.title}</Link>
      </h3>
      <p className={styles.author}>{book.author}</p>
      <RatingStars rating={book.rating} count={book.ratingCount} />
      <div className={styles.priceRow}>
        <span className={styles.price}>{formatPrice(book.price)}</span>
        <button
          type="button"
          className={styles.add}
          disabled={out}
          data-added={justAdded || undefined}
          onClick={onAdd}
        >
          {out ? "Notify me" : justAdded ? "Added ✓" : "Add"}
        </button>
      </div>
    </article>
  );
}
