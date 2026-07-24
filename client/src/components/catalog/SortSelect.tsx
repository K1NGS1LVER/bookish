import { SORT_OPTIONS } from "shared";
import styles from "./SortSelect.module.css";

export function SortSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (sort: string) => void;
}) {
  return (
    <label className={styles.wrap}>
      <span className={styles.label}>Sort by</span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
