"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/delivery/AuthCard";
import { PasswordField } from "@/components/delivery/PasswordField";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { passwordProblem, RegistrationError, requestPasswordReset, resetPassword } from "@/services/delivery-registration";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_AFTER = 30;
const inputClasses =
  "w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-app-text placeholder:text-app-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

interface Errors {
  email?: string;
  code?: string;
  next?: string;
  confirm?: string;
}

// Forgot password: a 6-digit code goes to the partner's registered email; with it they choose a new password.
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function sendCode() {
    setFormError(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setStep("reset");
      setResendIn(RESEND_AFTER);
      setErrors({});
    } catch (error) {
      setFormError(error instanceof RegistrationError ? error.message : "The code couldn't be sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (step === "email") return sendCode();
    setFormError(null);
    const found: Errors = {};
    if (!/^\d{6}$/.test(code.trim())) found.code = "Enter the 6-digit code from the email.";
    const problem = passwordProblem(next);
    if (problem) found.next = problem;
    else if (confirm !== next) found.confirm = "The passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await resetPassword(email, code, next);
      router.replace("/delivery?reset=1");
    } catch (error) {
      setBusy(false);
      const message = error instanceof RegistrationError ? error.message : "The password couldn't be reset. Please try again.";
      if (/code/i.test(message)) setErrors({ code: message });
      else setFormError(message);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle={
        step === "email"
          ? "Enter the email you sign in with. We'll send a 6-digit code to it."
          : `If ${email.trim()} is registered, a 6-digit code has been sent to it. It expires in 10 minutes.`
      }
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        {step === "email" ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="reset-email" className="text-sm font-medium text-app-text">
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors({});
              }}
              disabled={busy}
              maxLength={254}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "reset-email-error" : undefined}
              className={cn(inputClasses, errors.email ? "border-danger" : "border-app-muted/40")}
            />
            {errors.email && (
              <p id="reset-email-error" className="text-xs text-danger">
                {errors.email}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="reset-code" className="text-sm font-medium text-app-text">
                Code from the email
              </label>
              <input
                id="reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter the 6-digit code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setErrors((e) => ({ ...e, code: undefined }));
                }}
                disabled={busy}
                maxLength={6}
                aria-invalid={errors.code ? true : undefined}
                aria-describedby={errors.code ? "reset-code-error" : undefined}
                className={cn(inputClasses, "tracking-widest", errors.code ? "border-danger" : "border-app-muted/40")}
              />
              {errors.code && (
                <p id="reset-code-error" className="text-xs text-danger">
                  {errors.code}
                </p>
              )}
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={busy || resendIn > 0}
                className="self-end text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-app-muted disabled:no-underline"
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
            </div>
            <PasswordField
              id="reset-new-password"
              label="New password"
              value={next}
              onChange={(v) => {
                setNext(v);
                setErrors((e) => ({ ...e, next: undefined }));
              }}
              error={errors.next}
              hint="At least 10 characters, with letters and numbers."
              placeholder="Enter a new password"
              autoComplete="new-password"
              disabled={busy}
            />
            <PasswordField
              id="reset-confirm-password"
              label="Confirm new password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                setErrors((e) => ({ ...e, confirm: undefined }));
              }}
              error={errors.confirm}
              placeholder="Enter the new password again"
              autoComplete="new-password"
              disabled={busy}
            />
          </>
        )}

        <Button type="submit" className="mt-2 w-full" loading={busy}>
          {step === "email" ? (busy ? "Sending…" : "Send code") : busy ? "Resetting…" : "Reset password"}
        </Button>
        <Link
          href="/delivery"
          className="text-center text-sm text-app-muted hover:text-app-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to sign in
        </Link>
      </form>
    </AuthCard>
  );
}
