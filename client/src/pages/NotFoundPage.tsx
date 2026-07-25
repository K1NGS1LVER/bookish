import { Link } from "react-router-dom";
import { useHead } from "../hooks";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  useHead({
    title: "Page not found — Bookish.",
    description: "The page you're looking for doesn't exist.",
  });

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
