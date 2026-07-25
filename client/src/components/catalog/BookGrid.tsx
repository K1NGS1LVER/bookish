import type { Book } from "shared";
import { AnimatePresence, motion } from "motion/react";
import {
  cardEnterTransition,
  gridItemVariants,
  layoutTransition,
  staggerStepSeconds,
} from "../../motion";
import { usePrefersReducedMotion } from "../../hooks";
import { SkeletonCard } from "../ui/Skeleton";
import { BookCard } from "./BookCard";
import styles from "./BookGrid.module.css";

// Cap how many cards' worth of stagger delay stack up, so a large result
// set still finishes its entrance cascade in a bounded time.
const MAX_STAGGER_INDEX = 12;

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
            animate={
              reducedMotion
                ? "show"
                : {
                    ...gridItemVariants.show,
                    transition: {
                      ...cardEnterTransition(),
                      delay: Math.min(index, MAX_STAGGER_INDEX) * staggerStepSeconds(),
                    },
                  }
            }
            exit="hidden"
            transition={
              reducedMotion
                ? { duration: 0 }
                : { ...cardEnterTransition(), layout: layoutTransition() }
            }
          >
            <BookCard book={book} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
