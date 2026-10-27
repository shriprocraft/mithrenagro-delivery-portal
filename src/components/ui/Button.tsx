"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  // Shows a spinner and disables the button so an in-flight action can't be repeated.
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary",
  secondary: "bg-primary-light text-primary-dark hover:bg-primary-light/80 focus-visible:ring-primary",
  ghost: "bg-transparent text-app-text hover:bg-app-border/40 focus-visible:ring-primary",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        loading && "disabled:cursor-wait disabled:opacity-80",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
