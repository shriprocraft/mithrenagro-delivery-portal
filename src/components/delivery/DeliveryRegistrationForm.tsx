"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { OtpVerifier } from "@/components/delivery/OtpVerifier";
import {
  registerDeliveryPartner,
  RegistrationError,
  type DeliveryPartnerProfile,
  type DeliveryRegistrationInput,
  type IdentityType,
  type RegistrationField,
  type VehicleType,
} from "@/services/delivery-registration";

// Same rules as the backend (app/schemas/delivery.py), so most mistakes are caught before sending.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(?:\+?91)?([6-9]\d{9})$/;
// Tamil Nadu (TN 33 AB 1234) or Bharat series (22 BH 1234 AA) registrations.
const VEHICLE_NUMBER_PATTERN = /^(?:TN[0-9]{2}[A-Z]{1,2}[0-9]{4}|[0-9]{2}BH[0-9]{4}[A-Z]{1,2})$/;
const DRIVING_LICENSE_PATTERN = /^[A-Z]{2}[0-9A-Z]{8,14}$/;
const ACCOUNT_PATTERN = /^\d{9,18}$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
// Exactly 12 digits; UIDAI never issues a number starting with 0 or 1 (the backend checks the same).
const AADHAAR_PATTERN = /^\d{12}$/;
const AADHAAR_FIRST_DIGIT = /^[2-9]/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Removes spaces (including non-breaking ones), dashes, dots and invisible characters that come along
// when a number is pasted, then upper-cases: "2345 6789 0123" -> "234567890123", "abcde 1234 f" -> "ABCDE1234F".
const compact = (value: string) => value.replace(/[\s\-.\u200B-\u200D\uFEFF]/g, "").toUpperCase();
const phoneDigits = (value: string) => PHONE_PATTERN.exec(value.replace(/[\s-]/g, ""))?.[1] ?? null;
const normalEmail = (value: string) => (EMAIL_PATTERN.test(value.trim()) ? value.trim().toLowerCase() : null);

// The form keeps the Aadhaar and PAN numbers separately, so switching between them never loses what was
// typed; identity_number is taken from the selected one when registering.
type Values = Omit<DeliveryRegistrationInput, "phone_verification_token" | "email_verification_token" | "identity_number"> & {
  aadhaar_number: string;
  pan_number: string;
};
type Errors = Partial<Record<RegistrationField, string>>;

const EMPTY: Values = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  vehicle_type: "bike",
  vehicle_number: "",
  driving_license: "",
  bank_account: "",
  ifsc: "",
  identity_type: "aadhaar",
  aadhaar_number: "",
  pan_number: "",
};

const STEPS: { title: string; hint: string; fields: RegistrationField[] }[] = [
  { title: "Personal profile", hint: "How we reach you and how you sign in.", fields: ["full_name", "phone", "email", "password"] },
  { title: "Vehicle information", hint: "The vehicle you deliver with.", fields: ["vehicle_type", "vehicle_number", "driving_license"] },
  {
    title: "Bank & identity",
    hint: "For your payouts and verification.",
    fields: ["bank_account", "ifsc", "identity_type", "identity_number"],
  },
];

const VEHICLES: { value: VehicleType; label: string; hint: string }[] = [
  { value: "bike", label: "Bike", hint: "Motorcycle" },
  { value: "scooter", label: "Scooter", hint: "Petrol scooter" },
  { value: "ev", label: "EV", hint: "Electric two-wheeler" },
];

function validate(values: Values, fields: RegistrationField[]): Errors {
  const v = values;
  const all: Errors = {};
  const name = v.full_name.trim();
  if (name.length < 2 || name.length > 80) all.full_name = "Enter your full name (2–80 characters).";
  if (!PHONE_PATTERN.test(v.phone.replace(/[\s-]/g, ""))) all.phone = "Enter a 10-digit Indian mobile number.";
  if (!EMAIL_PATTERN.test(v.email.trim())) all.email = "Enter a valid email address.";
  if (v.password.length < 10 || !/[A-Za-z]/.test(v.password) || !/\d/.test(v.password))
    all.password = "Use at least 10 characters with letters and numbers.";
  if (!VEHICLE_NUMBER_PATTERN.test(compact(v.vehicle_number)))
    all.vehicle_number = "Enter a Tamil Nadu (TN 33 AB 1234) or BH series (22 BH 1234 AA) number.";
  if (!DRIVING_LICENSE_PATTERN.test(compact(v.driving_license)))
    all.driving_license = "Enter the driving licence number, like TN33 20190001234.";
  if (!ACCOUNT_PATTERN.test(v.bank_account.replace(/[\s-]/g, ""))) all.bank_account = "Account number should be 9 to 18 digits.";
  if (!IFSC_PATTERN.test(compact(v.ifsc))) all.ifsc = "IFSC should look like HDFC0001234.";
  if (v.identity_type === "aadhaar") {
    const aadhaar = compact(v.aadhaar_number);
    if (!AADHAAR_PATTERN.test(aadhaar))
      all.identity_number = `Aadhaar number should be exactly 12 digits (you entered ${aadhaar.replace(/\D/g, "").length}${/\D/.test(aadhaar) ? " and other characters" : ""}).`;
    else if (!AADHAAR_FIRST_DIGIT.test(aadhaar)) all.identity_number = "Aadhaar numbers never start with 0 or 1. Check the number.";
  } else if (!PAN_PATTERN.test(compact(v.pan_number))) {
    all.identity_number = "PAN should be 5 letters, 4 digits and a letter, like ABCDE1234F.";
  }
  return Object.fromEntries(Object.entries(all).filter(([key]) => fields.includes(key as RegistrationField)));
}

const inputClasses =
  "w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-app-text placeholder:text-app-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60";

interface FieldProps {
  id: RegistrationField;
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; className: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}

function Field({ id, label, error, hint, children }: FieldProps) {
  const inputId = `reg-${id}`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-app-text">
        {label}
      </label>
      {children({
        id: inputId,
        className: cn(inputClasses, error ? "border-danger" : "border-app-muted/40"),
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="text-xs text-app-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Registration progress">
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={s.title} className="flex flex-1 items-center gap-2" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-sm font-semibold transition-colors",
                done && "bg-primary text-white",
                current && "bg-primary text-white ring-4 ring-primary-light",
                !done && !current && "bg-app-border text-app-muted"
              )}
            >
              {done ? <CheckCircleIcon className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-xs font-medium sm:block", current ? "text-app-text" : "text-app-muted")}>
              {s.title}
            </span>
            {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1 rounded-pill", done ? "bg-primary" : "bg-app-border")} />}
          </li>
        );
      })}
    </ol>
  );
}

export function DeliveryRegistrationForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState<DeliveryPartnerProfile | null>(null);
  // Both the mobile number and the email are verified by OTP in Step 1; registration sends both tokens.
  const [verification, setVerification] = useState<Record<"phone" | "email", { value: string; token: string } | null>>({
    phone: null,
    email: null,
  });
  const phoneVerified = !!verification.phone && verification.phone.value === phoneDigits(values.phone);
  const emailVerified = !!verification.email && verification.email.value === normalEmail(values.email);

  function clearVerification(channel: "phone" | "email") {
    setVerification((prev) => ({ ...prev, [channel]: null }));
  }

  function requireVerified(found: Errors): Errors {
    if (!found.phone && !phoneVerified) found.phone = "Verify your mobile number with the OTP to continue.";
    if (!found.email && !emailVerified) found.email = "Verify your email with the OTP to continue.";
    return found;
  }
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the step heading so keyboard and screen-reader users follow the step change
  // (not on first load, where the page's own heading comes first).
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [step, registered]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // The Aadhaar and PAN inputs report their errors under identity_number (handled by their own onChange).
    const field = key as string as RegistrationField;
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function next() {
    const stepErrors = validate(values, STEPS[step].fields);
    if (step === 0) requireVerified(stepErrors);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      setFormError(null);
      setStep((s) => s + 1);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < STEPS.length - 1) return next();
    if (submitting) return;
    setFormError(null);
    const allErrors = requireVerified(validate(values, STEPS.flatMap((s) => s.fields)));
    setErrors(allErrors);
    const firstBad = STEPS.findIndex((s) => s.fields.some((f) => allErrors[f]));
    if (firstBad !== -1) {
      setStep(firstBad);
      return;
    }
    setSubmitting(true);
    try {
      // The Aadhaar and PAN inputs are form-only: only the selected one is sent, as identity_number.
      const { aadhaar_number, pan_number, ...fields } = values;
      setRegistered(
        await registerDeliveryPartner({
          ...fields,
          full_name: values.full_name.trim(),
          email: values.email.trim(),
          vehicle_number: compact(values.vehicle_number),
          driving_license: compact(values.driving_license),
          ifsc: compact(values.ifsc),
          identity_number: compact(values.identity_type === "aadhaar" ? aadhaar_number : pan_number),
          phone_verification_token: verification.phone!.token,
          email_verification_token: verification.email!.token,
        })
      );
    } catch (error) {
      const e = error instanceof RegistrationError ? error : new RegistrationError("Registration failed. Please try again.");
      setFormError(e.message);
      setErrors(e.fieldErrors);
      // A verification was refused or expired: that number or address has to be verified again.
      if (e.fieldErrors.phone) clearVerification("phone");
      if (e.fieldErrors.email) clearVerification("email");
      // Go back to the first step with a field the server refused (for example, an email already in use).
      const bad = STEPS.findIndex((s) => s.fields.some((f) => e.fieldErrors[f]));
      if (bad !== -1) setStep(bad);
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-primary-light text-primary">
          <CheckCircleIcon className="h-8 w-8" />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-app-text focus:outline-none">
          Registration submitted
        </h2>
        <p className="text-sm text-app-muted">
          Welcome, {registered.full_name.split(" ")[0]}! Our team will verify your licence and documents. You’ll be able
          to take deliveries once your account is approved.
        </p>
        <dl className="mt-2 w-full rounded-md border border-app-border bg-app-bg px-4 py-3 text-left text-sm">
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-app-muted">Status</dt>
            <dd className="font-medium text-warning">Pending verification</dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-app-muted">Vehicle</dt>
            <dd className="font-medium text-app-text">
              {VEHICLES.find((v) => v.value === registered.vehicle_type)?.label} · {registered.vehicle_number}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-app-muted">Payout account</dt>
            <dd className="font-medium text-app-text">•••• {registered.bank_account_last4}</dd>
          </div>
        </dl>
        <Link
          href="/delivery"
          className="mt-3 inline-flex w-full items-center justify-center rounded-pill bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  const current = STEPS[step];
  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
      <Stepper step={step} />
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-app-text focus:outline-none">
          {current.title}
        </h2>
        <p className="text-sm text-app-muted">{current.hint}</p>
      </div>

      {formError && (
        <p role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}

      <fieldset disabled={submitting} className="flex flex-col gap-4">
        {step === 0 && (
          <>
            <Field id="full_name" label="Full name" error={errors.full_name}>
              {(p) => (
                <input {...p} autoComplete="name" placeholder="Arjun Kumar" maxLength={80} value={values.full_name} onChange={(e) => set("full_name", e.target.value)} />
              )}
            </Field>
            <Field id="phone" label="Mobile number" error={errors.phone}>
              {(p) => (
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-app-muted/40 bg-app-bg px-3 text-sm text-app-muted">+91</span>
                  <input
                    {...p}
                    className={cn(p.className, "rounded-l-none", phoneVerified && "border-primary bg-primary-light/40")}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98400 12345"
                    maxLength={14}
                    value={values.phone}
                    readOnly={phoneVerified}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
              )}
            </Field>
            <OtpVerifier
              channel="phone"
              destination={phoneDigits(values.phone)}
              invalidMessage="Enter a 10-digit Indian mobile number."
              verified={phoneVerified}
              onVerified={(token, value) => {
                setVerification((prev) => ({ ...prev, phone: { value, token } }));
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              onReset={() => clearVerification("phone")}
              onFieldError={(message) => setErrors((prev) => ({ ...prev, phone: message }))}
              disabled={submitting}
            />
            <Field id="email" label="Email address" error={errors.email}>
              {(p) => (
                <input
                  {...p}
                  className={cn(p.className, emailVerified && "border-primary bg-primary-light/40")}
                  type="email"
                  autoComplete="email"
                  placeholder="arjun@example.com"
                  maxLength={254}
                  value={values.email}
                  readOnly={emailVerified}
                  onChange={(e) => set("email", e.target.value)}
                />
              )}
            </Field>
            <OtpVerifier
              channel="email"
              destination={normalEmail(values.email)}
              invalidMessage="Enter a valid email address."
              verified={emailVerified}
              onVerified={(token, value) => {
                setVerification((prev) => ({ ...prev, email: { value, token } }));
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              onReset={() => clearVerification("email")}
              onFieldError={(message) => setErrors((prev) => ({ ...prev, email: message }))}
              disabled={submitting}
            />
            <Field id="password" label="Password" error={errors.password} hint="At least 10 characters with letters and numbers.">
              {(p) => (
                <div className="relative">
                  <input {...p} className={cn(p.className, "pr-11")} type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={128} value={values.password} onChange={(e) => set("password", e.target.value)} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-app-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              )}
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium text-app-text">Vehicle type</legend>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLES.map((v) => (
                  <label
                    key={v.value}
                    className={cn(
                      "flex cursor-pointer flex-col items-center rounded-md border px-2 py-3 text-center transition-colors focus-within:ring-2 focus-within:ring-primary",
                      values.vehicle_type === v.value
                        ? "border-primary bg-primary-light text-primary-dark"
                        : "border-app-muted/40 bg-surface text-app-text hover:border-primary/60"
                    )}
                  >
                    <input type="radio" name="vehicle_type" value={v.value} checked={values.vehicle_type === v.value} onChange={() => set("vehicle_type", v.value)} className="sr-only" />
                    <span className="text-sm font-semibold">{v.label}</span>
                    <span className="text-[11px] text-app-muted">{v.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field id="vehicle_number" label="Vehicle registration number" error={errors.vehicle_number}>
              {(p) => (
                <input {...p} className={cn(p.className, "uppercase")} autoComplete="off" placeholder="TN 33 AB 1234 or 22 BH 1234 AA" maxLength={16} value={values.vehicle_number} onChange={(e) => set("vehicle_number", e.target.value)} />
              )}
            </Field>
            <Field id="driving_license" label="Driving licence number" error={errors.driving_license}>
              {(p) => (
                <input {...p} className={cn(p.className, "uppercase")} autoComplete="off" placeholder="TN33 20190001234" maxLength={20} value={values.driving_license} onChange={(e) => set("driving_license", e.target.value)} />
              )}
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field id="bank_account" label="Bank account number" error={errors.bank_account} hint="Payouts go to this account. We keep only the last 4 digits.">
              {(p) => (
                <input {...p} inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012" maxLength={22} value={values.bank_account} onChange={(e) => set("bank_account", e.target.value)} />
              )}
            </Field>
            <Field id="ifsc" label="IFSC code" error={errors.ifsc}>
              {(p) => (
                <input {...p} className={cn(p.className, "uppercase")} autoComplete="off" placeholder="HDFC0001234" maxLength={11} value={values.ifsc} onChange={(e) => set("ifsc", e.target.value)} />
              )}
            </Field>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium text-app-text">Identity document</legend>
              <div className="inline-flex rounded-pill bg-app-bg p-1" role="radiogroup" aria-label="Identity document">
                {(["aadhaar", "pan"] as IdentityType[]).map((t) => (
                  <label
                    key={t}
                    className={cn(
                      "flex-1 cursor-pointer rounded-pill px-4 py-1.5 text-center text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-primary",
                      values.identity_type === t ? "bg-primary text-white shadow-card" : "text-app-muted hover:text-app-text"
                    )}
                  >
                    <input type="radio" name="identity_type" value={t} checked={values.identity_type === t} onChange={() => {
                        // Only the selected document changes; both numbers (and the bank details) are kept.
                        set("identity_type", t);
                        setErrors((prev) => ({ ...prev, identity_number: undefined }));
                      }} className="sr-only" />
                    {t === "aadhaar" ? "Aadhaar" : "PAN"}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field
              id="identity_number"
              label={values.identity_type === "aadhaar" ? "Aadhaar number" : "PAN"}
              error={errors.identity_number}
              hint="Used to verify you. We keep only the last 4 characters."
            >
              {(p) => (
                <input
                  {...p}
                  className={cn(p.className, values.identity_type === "pan" && "uppercase")}
                  inputMode={values.identity_type === "aadhaar" ? "numeric" : "text"}
                  autoComplete="off"
                  placeholder={values.identity_type === "aadhaar" ? "2345 6789 0123" : "ABCDE1234F"}
                  // Room for spaces or dashes in a pasted number; it is cleaned before checking.
                  maxLength={values.identity_type === "aadhaar" ? 20 : 16}
                  value={values.identity_type === "aadhaar" ? values.aadhaar_number : values.pan_number}
                  onChange={(e) => {
                    set(values.identity_type === "aadhaar" ? "aadhaar_number" : "pan_number", e.target.value);
                    if (errors.identity_number) setErrors((prev) => ({ ...prev, identity_number: undefined }));
                  }}
                />
              )}
            </Field>
          </>
        )}
      </fieldset>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button type="button" variant="secondary" className="flex-1" disabled={submitting} onClick={() => { setErrors({}); setStep((s) => s - 1); }}>
            Back
          </Button>
        )}
        <Button type="submit" className="flex-1" loading={submitting}>
          {step < STEPS.length - 1 ? "Continue" : submitting ? "Registering…" : "Register"}
        </Button>
      </div>
      <p className="mt-6 text-center text-sm text-app-muted">
        Already registered?{" "}
        <Link
          href="/delivery"
          className="rounded-sm font-medium text-primary hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
