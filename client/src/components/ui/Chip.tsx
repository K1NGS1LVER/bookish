import type { ReactNode } from "react";
import styles from "./Chip.module.css";

export function Chip({
  children,
  onRemove,
}: {
  children: ReactNode;
  onRemove?: () => void;
}) {
  if (!onRemove) return <span className={styles.chip}>{children}</span>;
  return (
    <button
      type="button"
      className={`${styles.chip} ${styles.removable}`}
      onClick={onRemove}
    >
      {children}
      <span aria-hidden="true" className={styles.x}>
        ×
      </span>
      <span className="visually-hidden">(remove filter)</span>
    </button>
  );
}
