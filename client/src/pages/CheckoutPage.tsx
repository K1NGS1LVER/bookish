import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  CHECKOUT_FIELDS,
  cartTotals,
  formatPrice,
  validateCheckout,
  validateField,
  type CheckoutFields,
  type OrderConfirmation,
} from "shared";
import { ApiError, coverUrl, createOrder } from "../api";
import { FormField } from "../components/checkout/FormField";
import { Button } from "../components/ui/Button";
import { useCart } from "../store/cartStore";
import styles from "./CheckoutPage.module.css";

const EMPTY: CheckoutFields = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pin: "",
};

const LABELS: Record<keyof CheckoutFields, string> = {
  name: "Full name",
  email: "Email",
  phone: "Phone",
  address: "Address",
  city: "City",
  state: "State",
  pin: "PIN code",
};

const HINTS: Partial<Record<keyof CheckoutFields, string>> = {
  phone: "10 digits, no spaces",
  pin: "6-digit Indian PIN code",
};

export function CheckoutPage() {
  const { items, clear } = useCart();
  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<CheckoutFields>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutFields, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  if (confirmation) return <SuccessScreen confirmation={confirmation} />;

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h1 className={styles.emptyTitle}>Nothing to check out.</h1>
        <p className={styles.emptyHint}>Your shelf is empty — go find something good.</p>
        <Link to="/" className={styles.emptyLink}>
          Back to the shelves
        </Link>
      </div>
    );
  }

  const totals = cartTotals(items.map((i) => ({ price: i.book.price, qty: i.qty })));
  const formValid = Object.keys(validateCheckout(fields)).length === 0;

  function setField(field: keyof CheckoutFields, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    // Re-validate live once a field has already shown an error.
    if (touched[field]) {
      setErrors((e) => ({ ...e, [field]: validateField(field, value) ?? undefined }));
    }
  }

  function onBlur(field: keyof CheckoutFields) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({
      ...e,
      [field]: validateField(field, fields[field]) ?? undefined,
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const allErrors = validateCheckout(fields);
    setTouched(Object.fromEntries(CHECKOUT_FIELDS.map((f) => [f, true])));
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const confirmed = await createOrder({
        ...fields,
        items: items.map((i) => ({ bookId: i.book.id, qty: i.qty })),
      });
      clear();
      setConfirmation(confirmed);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields as Partial<CheckoutFields>);
      }
      setSubmitError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Checkout</h1>
      <div className={styles.layout}>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <h2 className={styles.sectionTitle}>Delivery details</h2>
          {CHECKOUT_FIELDS.map((field) => (
            <FormField
              key={field}
              id={`checkout-${field}`}
              label={LABELS[field]}
              hint={HINTS[field]}
              error={errors[field]}
              type={field === "email" ? "email" : "text"}
              inputMode={field === "phone" || field === "pin" ? "numeric" : undefined}
              autoComplete={AUTOCOMPLETE[field]}
              value={fields[field]}
              onChange={(e) => setField(field, e.target.value)}
              onBlur={() => onBlur(field)}
            />
          ))}

          {submitError && (
            <p className={styles.submitError} role="alert">
              {submitError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={!formValid || submitting}>
            {submitting ? "Placing order…" : `Place order · ${formatPrice(totals.total)}`}
          </Button>
          <p className={styles.disclaimer}>
            This is an order summary only — no payment is collected.
          </p>
        </form>

        <aside className={styles.summary} aria-label="Order summary">
          <h2 className={styles.sectionTitle}>Your order</h2>
          <ul className={styles.lines}>
            {items.map(({ book, qty }) => (
              <li key={book.id} className={styles.line}>
                <img src={coverUrl(book.isbn)} alt="" width="40" height="60" />
                <span className={styles.lineTitle}>
                  {book.title}
                  <span className={styles.lineQty}> × {qty}</span>
                </span>
                <span className={styles.linePrice}>
                  {formatPrice(book.price * qty)}
                </span>
              </li>
            ))}
          </ul>
          <dl className={styles.totals}>
            <dt>Subtotal</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
            <dt>Tax (5%)</dt>
            <dd>{formatPrice(totals.tax)}</dd>
            <dt className={styles.grand}>Total</dt>
            <dd className={styles.grand}>{formatPrice(totals.total)}</dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}

const AUTOCOMPLETE: Record<keyof CheckoutFields, string> = {
  name: "name",
  email: "email",
  phone: "tel-national",
  address: "street-address",
  city: "address-level2",
  state: "address-level1",
  pin: "postal-code",
};

function SuccessScreen({ confirmation }: { confirmation: OrderConfirmation }) {
  return (
    <div className={styles.success}>
      <div className={styles.successMark} aria-hidden="true">
        ✓
      </div>
      <h1 className={styles.successTitle}>Order placed!</h1>
      <p className={styles.successOrder}>
        Order number <strong>{confirmation.orderNumber}</strong>
      </p>
      <ul className={styles.successItems}>
        {confirmation.items.map((item) => (
          <li key={item.title}>
            <span>
              {item.title} <span className={styles.lineQty}>× {item.qty}</span>
            </span>
            <span>{formatPrice(item.unitPrice * item.qty)}</span>
          </li>
        ))}
        <li className={styles.successTotal}>
          <span>Total (incl. 5% tax)</span>
          <span>{formatPrice(confirmation.total)}</span>
        </li>
      </ul>
      <Link to="/" className={styles.successLink}>
        Back to store
      </Link>
    </div>
  );
}
