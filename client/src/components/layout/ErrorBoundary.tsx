import { Component, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={styles.fallback} role="alert">
        <h1 className={styles.title}>Well, this is awkward.</h1>
        <p className={styles.message}>
          Something went wrong while rendering the page. Your cart is safe.
        </p>
        <p className={styles.detail}>{this.state.error.message}</p>
        <a className={styles.home} href="/">
          Back to the store
        </a>
      </div>
    );
  }
}
