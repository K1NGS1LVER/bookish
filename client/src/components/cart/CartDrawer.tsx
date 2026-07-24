import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { cartTotals, formatPrice } from "shared";
import { coverUrl } from "../../api";
import { useFocusTrap, usePrefersReducedMotion, useScrollLock } from "../../hooks";
import { drawerTransition, overlayVariants, panelVariantsX } from "../../motion";
import { useCart } from "../../store/cartStore";
import { Button } from "../ui/Button";
import { QuantityStepper } from "../ui/QuantityStepper";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const { items, isOpen, closeDrawer, remove, setQty } = useCart();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  useFocusTrap(panelRef, isOpen, closeDrawer);
  useScrollLock(isOpen);

  const { subtotal } = cartTotals(
    items.map((i) => ({ price: i.book.price, qty: i.qty }))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.root}>
          <motion.div
            className={styles.overlay}
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={reducedMotion ? { duration: 0 } : drawerTransition()}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            className={styles.panel}
            variants={panelVariantsX}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={reducedMotion ? { duration: 0 } : drawerTransition()}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            <div className={styles.head}>
              <h2 className={styles.title}>Your shelf</h2>
              <button
                type="button"
                className={styles.close}
                aria-label="Close cart"
                onClick={closeDrawer}
              >
                ×
              </button>
            </div>

            {items.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>Your shelf is empty.</p>
                <p className={styles.emptyHint}>
                  Every great library starts with one book.
                </p>
                <Button variant="ghost" onClick={closeDrawer}>
                  Browse the shelves
                </Button>
              </div>
            ) : (
              <>
                <ul className={styles.list}>
                  {items.map(({ book, qty }) => (
                    <li key={book.id} className={styles.item}>
                      <Link
                        to={`/book/${book.id}`}
                        onClick={closeDrawer}
                        className={styles.thumbLink}
                      >
                        <img
                          className={styles.thumb}
                          src={coverUrl(book.isbn)}
                          alt=""
                          loading="lazy"
                          width="56"
                          height="84"
                        />
                      </Link>
                      <div className={styles.itemBody}>
                        <p className={styles.itemTitle}>{book.title}</p>
                        <p className={styles.itemAuthor}>{book.author}</p>
                        <div className={styles.itemControls}>
                          <QuantityStepper
                            qty={qty}
                            max={book.stock}
                            onChange={(n) => setQty(book.id, n)}
                            label={`Quantity of ${book.title}`}
                          />
                          <button
                            type="button"
                            className={styles.remove}
                            onClick={() => remove(book.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <p className={styles.itemPrice}>
                        {formatPrice(book.price * qty)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className={styles.foot}>
                  <div className={styles.subtotalRow}>
                    <span>Subtotal</span>
                    <span className={styles.subtotal}>{formatPrice(subtotal)}</span>
                  </div>
                  <p className={styles.shippingNote}>
                    Free shipping on every order. Taxes calculated at checkout.
                  </p>
                  <Button
                    size="lg"
                    full
                    onClick={() => {
                      closeDrawer();
                      navigate("/checkout");
                    }}
                  >
                    Checkout
                  </Button>
                  <Button variant="quiet" full onClick={closeDrawer}>
                    Continue shopping
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
