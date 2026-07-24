import styles from "./Skeleton.module.css";

export function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.shimmer} ${styles.cover}`} />
      <div className={`${styles.shimmer} ${styles.line}`} />
      <div className={`${styles.shimmer} ${styles.lineShort}`} />
    </div>
  );
}
