import { GENRES } from "shared";
import type { BookQuery } from "../../api";
import { Button } from "../ui/Button";
import styles from "./FilterPanel.module.css";

export interface FilterPanelProps {
  query: BookQuery;
  onChange: (patch: Partial<BookQuery>) => void;
  onClear: () => void;
}

export function FilterPanel({ query, onChange, onClear }: FilterPanelProps) {
  const genres = query.genres ?? [];

  function toggleGenre(genre: string) {
    onChange({
      genres: genres.includes(genre)
        ? genres.filter((g) => g !== genre)
        : [...genres, genre],
    });
  }

  return (
    <div className={styles.panel}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Genre</legend>
        {GENRES.map((genre) => (
          <label key={genre} className={styles.check}>
            <input
              type="checkbox"
              checked={genres.includes(genre)}
              onChange={() => toggleGenre(genre)}
            />
            {genre}
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Price (₹)</legend>
        <div className={styles.priceRow}>
          <label className={styles.priceField}>
            <span className={styles.priceLabel}>Min</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
              value={query.minPrice ?? ""}
              onChange={(e) => onChange({ minPrice: e.target.value })}
            />
          </label>
          <span className={styles.priceDash} aria-hidden="true">
            –
          </span>
          <label className={styles.priceField}>
            <span className={styles.priceLabel}>Max</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="999"
              value={query.maxPrice ?? ""}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Minimum rating</legend>
        <div className={styles.ratingRow} role="radiogroup" aria-label="Minimum rating">
          {[4.5, 4, 3.5, 3].map((r) => (
            <label key={r} className={styles.ratingOption}>
              <input
                type="radio"
                name="minRating"
                checked={query.minRating === String(r)}
                onChange={() => onChange({ minRating: String(r) })}
              />
              <span>★ {r}+</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className={`${styles.check} ${styles.stockToggle}`}>
        <input
          type="checkbox"
          checked={query.inStock ?? false}
          onChange={(e) => onChange({ inStock: e.target.checked })}
        />
        In stock only
      </label>

      <Button variant="quiet" onClick={onClear}>
        Clear all
      </Button>
    </div>
  );
}
