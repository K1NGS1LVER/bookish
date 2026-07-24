import type { Book } from "shared";
import { AnimatePresence, motion } from "motion/react";
import { cardEnterTransition, gridItemVariants, layoutTransition } from "../../motion";
import { usePrefersReducedMotion } from "../../hooks";
import { SkeletonCard } from "../ui/Skeleton";
import { BookCard } from "./BookCard";
import styles from "./BookGrid.module.css";

// mirrors --stagger-step (40ms) in theme.css
const STAGGER_STEP_SECONDS = 0.04;

export function BookGrid({
  books,
  loading,
  isFetching = false,
}: {
  books: Book[];
  loading: boolean;
  /** Background refetch (e.g. a filter change) while `books` still holds
   *  the previous results. Dims the grid in place instead of swapping to a
   *  differently-sized skeleton, which avoids a double layout jump. */
  isFetching?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();

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
      <div className={styles.emptyState} aria-busy={isFetching || undefined}>
        <p className={styles.emptyTitle}>Nothing on this shelf.</p>
        <p className={styles.emptyHint}>
          Try a different search or clear some filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={styles.grid}
      data-fetching={isFetching || undefined}
      aria-busy={isFetching || undefined}
    >
      <AnimatePresence mode="popLayout">
        {books.map((book, index) => (
          <motion.div
            key={book.id}
            layout
            variants={gridItemVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    ...cardEnterTransition(),
                    delay: index * STAGGER_STEP_SECONDS,
                    layout: layoutTransition(),
                  }
            }
          >
            <BookCard book={book} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
