import type { Transition, Variants } from "motion/react";

function cssSeconds(varName: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseFloat(raw) / 1000;
}

function cssNumber(varName: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseFloat(raw);
}

/** Ease-out-quint, no bounce — mirrors --ease-page in theme.css. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export function drawerTransition(): Transition {
  return { duration: cssSeconds("--duration-drawer"), ease: EASE };
}

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const panelVariantsX: Variants = {
  hidden: { x: "100%" },
  show: { x: 0 },
};

export const panelVariantsY: Variants = {
  hidden: { y: "100%" },
  show: { y: 0 },
};

export const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function cardEnterTransition(): Transition {
  return { duration: cssSeconds("--duration-card-enter"), ease: EASE };
}

export function layoutTransition(): Transition {
  return { duration: cssSeconds("--duration-grid-layout"), ease: EASE };
}

export function tapTransition(): Transition {
  return { duration: cssSeconds("--duration-tap") };
}

export function tapScale(): number {
  return cssNumber("--scale-tap");
}

export function staggerStepSeconds(): number {
  return cssSeconds("--stagger-step");
}
