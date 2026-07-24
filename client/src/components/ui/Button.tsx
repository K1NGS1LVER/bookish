import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "quiet";
  size?: "md" | "lg";
  full?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  full = false,
  className,
  ...rest
}: ButtonProps) {
  const cls = [
    styles.button,
    styles[variant],
    size === "lg" ? styles.lg : "",
    full ? styles.full : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return <button className={cls} {...rest} />;
}
