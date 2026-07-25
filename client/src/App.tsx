import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { MotionConfig } from "motion/react";
import { ReactLenis, useLenis } from "lenis/react";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { CartDrawer } from "./components/cart/CartDrawer";
import { HomePage } from "./pages/HomePage";
import { usePrefersReducedMotion } from "./hooks";
import toasterStyles from "./components/layout/Toaster.module.css";

const BookPage = lazy(() =>
  import("./pages/BookPage").then((m) => ({ default: m.BookPage }))
);
const CheckoutPage = lazy(() =>
  import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    if (hash) return; // let the #catalog hash-scroll effect (HomePage) handle this landing
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, lenis]);
  return null;
}

export function App() {
  const reducedMotion = usePrefersReducedMotion();
  const shell = (
    <ErrorBoundary>
      <ScrollToTop />
      <a href="#main-content" className="visually-hidden">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/book/:id"
            element={
              <ErrorBoundary>
                <Suspense>
                  <BookPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="/checkout"
            element={
              <ErrorBoundary>
                <Suspense>
                  <CheckoutPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="*"
            element={
              <Suspense>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <Toaster
        position="top-center"
        offset="5rem"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: toasterStyles.toast,
            title: toasterStyles.title,
            icon: toasterStyles.icon,
          },
        }}
      />
    </ErrorBoundary>
  );
  if (reducedMotion) {
    return <MotionConfig reducedMotion="user">{shell}</MotionConfig>;
  }
  return (
    <ReactLenis root options={{ autoRaf: true }}>
      <MotionConfig reducedMotion="user">{shell}</MotionConfig>
    </ReactLenis>
  );
}
