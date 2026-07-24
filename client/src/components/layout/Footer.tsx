import styles from "./Footer.module.css";

export function Footer() {
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

        <form
          className={styles.newsletter}
          onSubmit={(e) => e.preventDefault()}
          aria-label="Newsletter"
        >
          <label htmlFor="newsletter-email">Get our monthly reading list</label>
          <div className={styles.newsletterRow}>
            <input
              id="newsletter-email"
              type="email"
              placeholder="you@example.com"
            />
            <button type="submit">Join</button>
          </div>
        </form>
      </div>
      <p className={styles.legal}>
        © 2026 Bookish. Built for the CISOGenie UI assessment.
      </p>
    </footer>
  );
}
