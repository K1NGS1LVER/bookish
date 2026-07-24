import { Link } from "react-router-dom";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>This page is out of print.</h1>
      <p className={styles.hint}>The page you're after doesn't exist.</p>
      <Link to="/" className={styles.link}>
        Back to the shelves
      </Link>
    </div>
  );
}
