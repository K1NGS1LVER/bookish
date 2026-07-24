import type { BookQuery } from "../../api";
import { Chip } from "../ui/Chip";
import styles from "./FilterChips.module.css";

export function FilterChips({
  query,
  onChange,
}: {
  query: BookQuery;
  onChange: (patch: Partial<BookQuery>) => void;
}) {
  const chips: { label: string; clear: () => void }[] = [];

  for (const genre of query.genres ?? []) {
    chips.push({
      label: genre,
      clear: () =>
        onChange({ genres: (query.genres ?? []).filter((g) => g !== genre) }),
    });
  }
  if (query.minPrice)
    chips.push({
      label: `From ₹${query.minPrice}`,
      clear: () => onChange({ minPrice: "" }),
    });
  if (query.maxPrice)
    chips.push({
      label: `Up to ₹${query.maxPrice}`,
      clear: () => onChange({ maxPrice: "" }),
    });
  if (query.minRating)
    chips.push({
      label: `★ ${query.minRating}+`,
      clear: () => onChange({ minRating: "" }),
    });
  if (query.inStock)
    chips.push({
      label: "In stock",
      clear: () => onChange({ inStock: false }),
    });

  if (chips.length === 0) return null;

  return (
    <div className={styles.row} aria-label="Active filters">
      {chips.map((chip) => (
        <Chip key={chip.label} onRemove={chip.clear}>
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}
