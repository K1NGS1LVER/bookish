import { useId, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  function commit(raw: string) {
    setText(null);
    const typed = raw === "" ? NaN : Number(raw);
    const clamped = clampQty(typed, max);
    if (Number.isNaN(typed) || typed < 1) {
      setError("Quantity must be at least 1");
    } else if (typed > max) {
      setError(max === 0 ? "Out of stock" : `Only ${max} left in stock`);
    } else {
      setError(null);
    }
    onChange(clamped);
  }

  return (
    <span className={styles.wrap}>
      <span className={styles.stepper}>
        <button
          type="button"
          className={styles.btn}
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={qty <= 1}
          onClick={() => {
            setError(null);
            onChange(clampQty(qty - 1, max));
          }}
        >
          −
        </button>
        <input
          className={styles.input}
          type="text"
          inputMode="numeric"
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={text ?? String(qty)}
          onChange={(e) => {
            setText(e.target.value.replace(/\D/g, ""));
            if (error) setError(null);
          }}
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
          onClick={() => {
            setError(null);
            onChange(clampQty(qty + 1, max));
          }}
        >
          +
        </button>
      </span>
      {error && (
        <span id={errorId} role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </span>
  );
}
