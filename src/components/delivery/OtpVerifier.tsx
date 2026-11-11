"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { RegistrationError, sendOtp, verifyOtp, type OtpChannel } from "@/services/delivery-registration";

const CODE_PATTERN = /^\d{6}$/;

const COPY: Record<OtpChannel, { send: string; noun: string; change: string; shown: (d: string) => string }> = {
  phone: {
    send: "Send OTP",
    noun: "mobile number",
    change: "Change number",
    shown: (d) => `+91 ${d.replace(/(\d{5})(\d{5})/, "$1 $2")}`,
  },
  email: { send: "Send OTP", noun: "email", change: "Change email", shown: (d) => d },
};

interface OtpVerifierProps {
  channel: OtpChannel;
  // The normalized number or address, or null while what was typed isn't valid yet.
  destination: string | null;
  invalidMessage: string;
  verified: boolean;
  onVerified: (token: string, destination: string) => void;
  onReset: () => void;
  // Shows (or clears, with undefined) an error on the phone or email field itself.
  onFieldError: (message: string | undefined) => void;
  disabled?: boolean;
}

/**
 * Sends a 6-digit code to a mobile number or email, takes the code, and reports the verification
 * token. When the backend runs without a provider (DELIVERY_OTP_SENDER=dev), the code is shown as
 * "Test Mode" under the code box.
 */
export function OtpVerifier({
  channel,
  destination,
  invalidMessage,
  verified,
  onVerified,
  onReset,
  onFieldError,
  disabled = false,
}: OtpVerifierProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const resendIn = Math.max(0, Math.ceil((resendAt - clock) / 1000));
  const copy = COPY[channel];
  const inputId = `reg-${channel}-otp`;

  // Ticks once a second while the resend countdown shows.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setClock(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [resendIn, clock]);

  // A code belongs to the number or address it was sent to: editing it starts over.
  useEffect(() => {
    if (sentTo !== null && destination !== sentTo && !verified) {
      setStatus("idle");
      setSentTo(null);
      setCode("");
      setCodeError(undefined);
      setDevCode(null);
    }
  }, [destination, sentTo, verified]);

  async function send() {
    if (!destination) {
      onFieldError(invalidMessage);
      return;
    }
    onFieldError(undefined);
    setCodeError(undefined);
    setStatus("sending");
    try {
      const sent = await sendOtp(channel, destination);
      const now = Date.now();
      setClock(now);
      setResendAt(now + sent.resend_in * 1000);
      setDevCode(sent.dev_code ?? null);
      setSentTo(destination);
      setCode("");
      setStatus("sent");
    } catch (error) {
      const e = error instanceof RegistrationError ? error : new RegistrationError("Couldn’t send the code. Try again.");
      onFieldError(e.fieldErrors[channel] ?? e.message);
      setStatus(sentTo ? "sent" : "idle");
    }
  }

  async function check() {
    if (!sentTo) return;
    if (!CODE_PATTERN.test(code)) {
      setCodeError("Enter the 6-digit code.");
      return;
    }
    setCodeError(undefined);
    setStatus("verifying");
    try {
      const token = await verifyOtp(channel, sentTo, code);
      setDevCode(null);
      setStatus("idle");
      onVerified(token, sentTo);
    } catch (error) {
      const e = error instanceof RegistrationError ? error : new RegistrationError("Couldn’t check the code. Try again.");
      setCodeError(e.fieldErrors.code ?? e.message);
      setStatus("sent");
    }
  }

  if (verified) {
    return (
      <div className="-mt-2 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1 rounded-pill bg-primary-light px-2.5 py-1 font-medium text-primary-dark" role="status">
          <CheckCircleIcon className="h-3.5 w-3.5" /> {channel === "phone" ? "Mobile number" : "Email"} verified
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setSentTo(null);
            setCode("");
            onReset();
          }}
          className="rounded-sm font-medium text-primary hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {copy.change}
        </button>
      </div>
    );
  }

  const codeOpen = status === "sent" || status === "verifying";
  return (
    <div className="-mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          loading={status === "sending"}
          disabled={disabled || resendIn > 0 || status === "verifying"}
          onClick={send}
        >
          {!codeOpen ? copy.send : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
        </Button>
        {!codeOpen && <span className="text-xs text-app-muted">Verify your {copy.noun} with a 6-digit code.</span>}
      </div>

      {codeOpen && sentTo && (
        <div className="flex flex-col gap-1 rounded-md border border-app-border bg-app-bg p-3">
          <label htmlFor={inputId} className="text-sm font-medium text-app-text">
            Enter your OTP <span className="font-normal text-app-muted">sent to {copy.shown(sentTo)}</span>
          </label>
          <div className="flex gap-2">
            <input
              id={inputId}
              className={cn(
                "w-full min-w-0 flex-1 rounded-md border bg-surface px-3 py-2.5 text-sm tracking-[0.4em] text-app-text placeholder:text-app-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                codeError ? "border-danger" : "border-app-muted/40"
              )}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              maxLength={6}
              value={code}
              disabled={disabled}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? `${inputId}-error` : devCode ? `${inputId}-test` : undefined}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                if (codeError) setCodeError(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void check();
                }
              }}
            />
            <Button type="button" className="shrink-0 px-4" loading={status === "verifying"} disabled={disabled} onClick={check}>
              Verify
            </Button>
          </div>
          {codeError && (
            <p id={`${inputId}-error`} className="text-xs text-danger">
              {codeError}
            </p>
          )}
          {devCode && (
            <p id={`${inputId}-test`} className="text-xs font-medium text-warning">
              Test Mode: Your OTP is <span className="font-semibold tracking-widest">{devCode}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
