import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { formatPrice, type Book } from "shared";
import { coverUrl, fetchBook, fetchRelated } from "../api";
import { RelatedCarousel } from "../components/catalog/RelatedCarousel";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { CoverImage } from "../components/ui/CoverImage";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { RatingStars } from "../components/ui/RatingStars";
import { useFetch, useHead, useTransitionLinkClick } from "../hooks";
import { useCart } from "../store/cartStore";
import styles from "./BookPage.module.css";

export function BookPage() {
  const { id = "" } = useParams();
  const bookId = Number(id);
  const { data: book, loading, error, retry } = useFetch(
    () => fetchBook(bookId),
    `book-${bookId}`
  );
  const { data: related } = useFetch(
    () => fetchRelated(bookId),
    `related-${bookId}`
  );

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true">
        <div className={styles.loadingSkeleton}>
          <div className={styles.loadingCover} />
          <div className={styles.loadingInfo}>
            <div className={styles.loadingLine} style={{ width: "40%" }} />
            <div className={styles.loadingLine} style={{ width: "80%" }} />
            <div className={styles.loadingLine} style={{ width: "50%" }} />
            <div className={styles.loadingLine} style={{ width: "30%" }} />
          </div>
        </div>
      </div>
    );
  }
  if (error || !book) {
    return (
      <div className={styles.errorState} role="alert">
        <p>{error ?? "Book not found"}</p>
        <div className={styles.errorActions}>
          <Button variant="ghost" onClick={retry}>
            Try again
          </Button>
          <Link to="/" className={styles.backLink}>
            Back to the shelves
          </Link>
        </div>
      </div>
    );
  }
  return <BookDetails book={book} related={related ?? []} />;
}

function BookDetails({ book, related }: { book: Book; related: Book[] }) {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const [qty, setQty] = useState(1);
  const out = book.stock === 0;

  useEffect(() => setQty(1), [book.id]);

  useHead({
    title: `${book.title} by ${book.author} — Bookish.`,
    description: book.description.slice(0, 160),
    image: coverUrl(book.isbn),
    url: `/book/${book.id}`,
    type: "book",
  });

  function onAdd() {
    add(book, qty);
    toast.success(`Added "${book.title}" to cart`);
    openDrawer();
  }

  const addLabel = out ? "Out of stock" : "Add to cart";
  const onBackToShelves = useTransitionLinkClick("/");

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
            author: { "@type": "Person", name: book.author },
            isbn: book.isbn,
            genre: book.genre,
            description: book.description,
            numberOfPages: book.pages,
            publisher: book.publisher,
            datePublished: String(book.year),
            image: coverUrl(book.isbn),
            offers: {
              "@type": "Offer",
              price: book.price,
              priceCurrency: "INR",
              availability: book.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: book.rating,
              ratingCount: book.ratingCount,
            },
          }),
        }}
      />
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link to="/" onClick={onBackToShelves}>Shelves</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/?genres=${encodeURIComponent(book.genre)}#catalog`}>
          {book.genre}
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{book.title}</span>
      </nav>

      <div className={styles.layout}>
        <div className={styles.coverPanel}>
          <CoverImage
            isbn={book.isbn}
            alt={`Cover of ${book.title}`}
            width={380}
            height={570}
            loading="eager"
            className={styles.cover}
            style={{ viewTransitionName: `book-cover-${book.id}` }}
          />
        </div>

        <div className={styles.info}>
          <Chip>{book.genre}</Chip>
          <h1 className={styles.title} style={{ viewTransitionName: `book-title-${book.id}` }}>
            {book.title}
          </h1>
          <p className={styles.author}>
            by{" "}
            <Link to={`/?search=${encodeURIComponent(book.author)}#catalog`}>
              {book.author}
            </Link>
          </p>
          <RatingStars rating={book.rating} count={book.ratingCount} />

          <p className={styles.price}>{formatPrice(book.price)}</p>
          <p className={styles.stockNote} data-out={out || undefined}>
            {out
              ? "Currently out of stock"
              : book.stock <= 5
                ? `Only ${book.stock} left in stock`
                : "In stock and ready to ship"}
          </p>

          <div className={styles.buyRow}>
            {!out && (
              <QuantityStepper qty={qty} max={book.stock} onChange={setQty} />
            )}
            <Button size="lg" disabled={out} onClick={onAdd}>
              {addLabel}
            </Button>
          </div>

          <div className={styles.accordions}>
            <details className={styles.accordion} open>
              <summary>Description</summary>
              <p>{book.description}</p>
            </details>
            <details className={styles.accordion}>
              <summary>Details</summary>
              <dl className={styles.detailsList}>
                <dt>ISBN</dt>
                <dd>{book.isbn}</dd>
                <dt>Pages</dt>
                <dd>{book.pages}</dd>
                <dt>Publisher</dt>
                <dd>{book.publisher}</dd>
                <dt>First published</dt>
                <dd>{book.year}</dd>
              </dl>
            </details>
            <details className={styles.accordion}>
              <summary>Ratings</summary>
              <p>
                Rated {book.rating.toFixed(1)} out of 5 by{" "}
                {book.ratingCount.toLocaleString("en-IN")} readers across our
                shelves.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className={styles.related} aria-label="More like this">
          <h2 className={styles.relatedTitle}>More like this</h2>
          <RelatedCarousel books={related} />
        </section>
      )}

      <div className={styles.stickyBar}>
        <span className={styles.stickyPrice}>{formatPrice(book.price)}</span>
        <Button disabled={out} onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
