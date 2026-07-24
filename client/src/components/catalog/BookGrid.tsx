import type { Book } from "shared";
import { SkeletonCard } from "../ui/Skeleton";
import { BookCard } from "./BookCard";
import styles from "./BookGrid.module.css";

export function BookGrid({
  books,
  loading,
}: {
  books: Book[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className={styles.grid} aria-busy="true">
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>Nothing on this shelf.</p>
        <p className={styles.emptyHint}>
          Try a different search or clear some filters.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
