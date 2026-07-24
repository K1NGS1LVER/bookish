import { useState } from "react";
import { clampQty } from "shared";
import styles from "./QuantityStepper.module.css";

export function QuantityStepper({
  qty,
  max,
  onChange,
  label = "Quantity",
}: {
  qty: number;
  max: number;
  onChange: (qty: number) => void;
  label?: string;
}) {
  // Local text state so the user can clear the field while typing;
  // clamps to [1, max] on blur.
  const [text, setText] = useState<string | null>(null);

  function commit(raw: string) {
    setText(null);
    onChange(clampQty(Number(raw), max));
  }

  return (
    <span className={styles.stepper}>
      <button
        type="button"
        className={styles.btn}
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={qty <= 1}
        onClick={() => onChange(clampQty(qty - 1, max))}
      >
        −
      </button>
      <input
        className={styles.input}
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={text ?? String(qty)}
        onChange={(e) => setText(e.target.value.replace(/\D/g, ""))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
        }}
      />
      <button
        type="button"
        className={styles.btn}
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={qty >= max}
        onClick={() => onChange(clampQty(qty + 1, max))}
      >
        +
      </button>
    </span>
  );
}
