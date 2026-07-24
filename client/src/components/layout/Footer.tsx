import { useEffect, useRef, useState } from "react";
import { validateField } from "shared";
import styles from "./Footer.module.css";

type NewsletterStatus = "idle" | "sent" | "invalid";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validateField("email", email);
    clearTimeout(timer.current);
    if (invalid) {
      setStatus("invalid");
      return;
    }
    setStatus("sent");
    setEmail("");
    timer.current = setTimeout(() => setStatus("idle"), 4000);
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.wordmark}>
            Bookish<span className={styles.period}>.</span>
          </p>
          <p className={styles.tagline}>
            An independent bookstore for people who read the acknowledgements.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className={styles.links}>
            <li><a href="#catalog">Browse</a></li>
            <li><a href="#catalog">Genres</a></li>
            <li><a href="#top">About</a></li>
            <li><a href="#top">Contact</a></li>
          </ul>
        </nav>

        <form className={styles.newsletter} onSubmit={onSubmit} aria-label="Newsletter" noValidate>
          <label htmlFor="newsletter-email">Get our monthly reading list</label>
          <div className={styles.newsletterRow}>
            <input
              id="newsletter-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              aria-invalid={status === "invalid" || undefined}
              aria-describedby="newsletter-status"
              data-error={status === "invalid" || undefined}
            />
            <button type="submit">Join</button>
          </div>
          <p
            id="newsletter-status"
            role="status"
            aria-live="polite"
            className={styles.newsletterStatus}
            data-visible={status !== "idle" || undefined}
          >
            {status === "sent" && "✓ An email has been sent!"}
            {status === "invalid" && "That doesn't look like a valid email — try again."}
          </p>
        </form>
      </div>
      <p className={styles.legal}>
        © 2026 Bookish. Built for the CISOGenie UI assessment.
      </p>
    </footer>
  );
}
