import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import type { Book } from "shared";
import { usePrefersReducedMotion } from "../../hooks";
import { BookCard } from "./BookCard";
import styles from "./RelatedCarousel.module.css";

export function RelatedCarousel({ books }: { books: Book[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  return (
    <div className={styles.wrap}>
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.container}>
          {books.map((book) => (
            <div key={book.id} className={styles.slide}>
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Previous books"
        disabled={!canPrev}
        onClick={() => emblaApi?.scrollPrev(reducedMotion)}
        className={styles.arrowPrev}
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>
      <button
        type="button"
        aria-label="Next books"
        disabled={!canNext}
        onClick={() => emblaApi?.scrollNext(reducedMotion)}
        className={styles.arrowNext}
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </div>
  );
}
