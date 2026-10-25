"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { findDemoPartnerId } from "@/services/mock-auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

const inputClasses =
  "w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-app-text placeholder:text-app-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function DeliveryLoginForm({ onSignIn }: { onSignIn: (partnerId: string) => boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate(email, password);
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    // Prototype check against demo fixtures only — see src/services/mock-auth.ts.
    const partnerId = findDemoPartnerId(email, password);
    if (!partnerId || !onSignIn(partnerId)) {
      setFormError("Email or password is incorrect.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="login-email" className="text-sm font-medium text-app-text">
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="arjunagro@gmail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className={cn(inputClasses, errors.email ? "border-danger" : "border-app-muted/40")}
        />
        {errors.email && (
          <p id="login-email-error" className="text-xs text-danger">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="text-sm font-medium text-app-text">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="demo123"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className={cn(inputClasses, "pr-11", errors.password ? "border-danger" : "border-app-muted/40")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-app-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" className="text-xs text-danger">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="mt-2 w-full">
        Sign In
      </Button>
    </form>
  );
}
