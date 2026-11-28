"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const inputClasses =
  "w-full rounded-md border bg-surface px-3 py-2.5 pr-11 text-sm text-app-text placeholder:text-app-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** A password input with a show/hide button, a label, an optional hint and its error. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  autoComplete: "current-password" | "new-password";
  disabled?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-app-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          maxLength={128}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClasses, error ? "border-danger" : "border-app-muted/40")}
        />
        <button
          type="button"
          onClick={() => setShown((prev) => !prev)}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-app-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {shown ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-app-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
