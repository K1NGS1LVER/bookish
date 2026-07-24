import styles from "./RatingStars.module.css";

export function RatingStars({
  rating,
  count,
}: {
  rating: number;
  count?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <span
      className={styles.wrap}
      role="img"
      aria-label={`Rated ${rating} out of 5${count != null ? `, ${count} ratings` : ""}`}
    >
      <span aria-hidden="true" className={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= rounded ? styles.full : styles.empty}>
            ★
          </span>
        ))}
      </span>
      <span aria-hidden="true" className={styles.value}>
        {rating.toFixed(1)}
      </span>
      {count != null && (
        <span aria-hidden="true" className={styles.count}>
          ({count.toLocaleString("en-IN")})
        </span>
      )}
    </span>
  );
}
