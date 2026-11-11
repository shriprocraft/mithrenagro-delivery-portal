"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  registerDeliveryPartner,
  RegistrationError,
  sendPhoneOtp,
  verifyPhoneOtp,
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
const AADHAAR_PATTERN = /^[2-9]\d{11}$/;
const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;
const CODE_PATTERN = /^\d{6}$/;

const compact = (value: string) => value.replace(/[\s-]/g, "").toUpperCase();
const phoneDigits = (value: string) => PHONE_PATTERN.exec(value.replace(/[\s-]/g, ""))?.[1] ?? null;

type Values = Omit<DeliveryRegistrationInput, "phone_verification_token">;
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
  identity_number: "",
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
  const id = compact(v.identity_number);
  if (v.identity_type === "aadhaar" && !AADHAAR_PATTERN.test(id)) all.identity_number = "Aadhaar number should be exactly 12 digits.";
  if (v.identity_type === "pan" && !PAN_PATTERN.test(id))
    all.identity_number = "PAN should be 5 letters, 4 digits and a letter, like ABCDE1234F.";
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
  // Mobile OTP: send a code, enter it, and keep the verification token for registering.
  const [otp, setOtp] = useState<{
    status: "idle" | "sending" | "sent" | "verifying" | "verified";
    code: string;
    devCode: string | null;
    resendAt: number;
    token: string | null;
    phone: string | null;
  }>({ status: "idle", code: "", devCode: null, resendAt: 0, token: null, phone: null });
  const [clock, setClock] = useState(() => Date.now());
  const resendIn = Math.max(0, Math.ceil((otp.resendAt - clock) / 1000));
  const phoneVerified = otp.status === "verified" && otp.phone === phoneDigits(values.phone);

  // Ticks once a second while a resend countdown is showing.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setClock(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [resendIn, clock]);

  function resetOtp() {
    setOtp({ status: "idle", code: "", devCode: null, resendAt: 0, token: null, phone: null });
  }

  async function sendCode() {
    const digits = phoneDigits(values.phone);
    if (!digits) {
      setErrors((prev) => ({ ...prev, phone: "Enter a 10-digit Indian mobile number." }));
      return;
    }
    setErrors((prev) => ({ ...prev, phone: undefined, code: undefined }));
    setOtp((prev) => ({ ...prev, status: "sending" }));
    try {
      const sent = await sendPhoneOtp(digits);
      const now = Date.now();
      setClock(now);
      setOtp({ status: "sent", code: "", devCode: sent.dev_code ?? null, resendAt: now + sent.resend_in * 1000, token: null, phone: digits });
    } catch (error) {
      const e = error instanceof RegistrationError ? error : new RegistrationError("Couldn’t send the code. Try again.");
      setErrors((prev) => ({ ...prev, phone: e.fieldErrors.phone ?? e.message }));
      setOtp((prev) => ({ ...prev, status: prev.phone ? "sent" : "idle" }));
    }
  }

  async function verifyCode() {
    if (!otp.phone) return;
    if (!CODE_PATTERN.test(otp.code.trim())) {
      setErrors((prev) => ({ ...prev, code: "Enter the 6-digit code." }));
      return;
    }
    setErrors((prev) => ({ ...prev, code: undefined }));
    setOtp((prev) => ({ ...prev, status: "verifying" }));
    try {
      const token = await verifyPhoneOtp(otp.phone, otp.code.trim());
      setOtp((prev) => ({ ...prev, status: "verified", token, devCode: null }));
    } catch (error) {
      const e = error instanceof RegistrationError ? error : new RegistrationError("Couldn’t check the code. Try again.");
      setErrors((prev) => ({ ...prev, code: e.fieldErrors.code ?? e.message }));
      setOtp((prev) => ({ ...prev, status: "sent" }));
    }
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
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function next() {
    const stepErrors = validate(values, STEPS[step].fields);
    if (step === 0 && !stepErrors.phone && !phoneVerified) stepErrors.phone = "Verify your mobile number to continue.";
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
    const allErrors = validate(values, STEPS.flatMap((s) => s.fields));
    if (!allErrors.phone && (!phoneVerified || !otp.token)) allErrors.phone = "Verify your mobile number to continue.";
    setErrors(allErrors);
    const firstBad = STEPS.findIndex((s) => s.fields.some((f) => allErrors[f]));
    if (firstBad !== -1) {
      setStep(firstBad);
      return;
    }
    setSubmitting(true);
    try {
      setRegistered(
        await registerDeliveryPartner({
          ...values,
          full_name: values.full_name.trim(),
          email: values.email.trim(),
          vehicle_number: compact(values.vehicle_number),
          driving_license: compact(values.driving_license),
          ifsc: compact(values.ifsc),
          identity_number: compact(values.identity_number),
          phone_verification_token: otp.token!,
        })
      );
    } catch (error) {
      const e = error instanceof RegistrationError ? error : new RegistrationError("Registration failed. Please try again.");
      setFormError(e.message);
      setErrors(e.fieldErrors);
      // The verification was refused or expired: the number has to be verified again.
      if (e.fieldErrors.phone) resetOtp();
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
            <Field
              id="phone"
              label="Mobile number"
              error={errors.phone}
              hint={phoneVerified ? undefined : "We’ll text a 6-digit code to verify this number."}
            >
              {(p) => (
                <div className="flex gap-2">
                  <div className="flex min-w-0 flex-1">
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
                      onChange={(e) => {
                        set("phone", e.target.value);
                        if (otp.status !== "idle") resetOtp();
                      }}
                    />
                  </div>
                  {phoneVerified ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-primary-light px-3 text-sm font-medium text-primary-dark" role="status">
                      <CheckCircleIcon className="h-4 w-4" /> Verified
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 px-3"
                      loading={otp.status === "sending"}
                      disabled={resendIn > 0 || otp.status === "verifying"}
                      onClick={sendCode}
                    >
                      {otp.status === "idle" || otp.status === "sending" ? "Send code" : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend"}
                    </Button>
                  )}
                </div>
              )}
            </Field>
            {phoneVerified && (
              <button
                type="button"
                onClick={() => { resetOtp(); setErrors((prev) => ({ ...prev, phone: undefined })); }}
                className="-mt-3 self-start rounded-sm text-xs font-medium text-primary hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Change number
              </button>
            )}
            {!phoneVerified && (otp.status === "sent" || otp.status === "verifying") && (
              <div className="-mt-1 flex flex-col gap-2 rounded-md border border-app-border bg-app-bg p-3">
                <Field id="code" label={`Enter the code sent to +91 ${otp.phone?.replace(/(\d{5})(\d{5})/, "$1 $2")}`} error={errors.code}>
                  {(p) => (
                    <div className="flex gap-2">
                      <input
                        {...p}
                        className={cn(p.className, "min-w-0 flex-1 tracking-[0.4em]")}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="••••••"
                        maxLength={6}
                        value={otp.code}
                        onChange={(e) => {
                          setOtp((prev) => ({ ...prev, code: e.target.value.replace(/\D/g, "") }));
                          if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void verifyCode();
                          }
                        }}
                      />
                      <Button type="button" className="shrink-0 px-4" loading={otp.status === "verifying"} onClick={verifyCode}>
                        Verify
                      </Button>
                    </div>
                  )}
                </Field>
                {otp.devCode && (
                  <p className="text-xs text-app-muted">
                    Test mode (no SMS provider connected yet): your code is{" "}
                    <span className="font-semibold tracking-widest text-app-text">{otp.devCode}</span>
                  </p>
                )}
              </div>
            )}
            <Field id="email" label="Email address" error={errors.email}>
              {(p) => (
                <input {...p} type="email" autoComplete="email" placeholder="arjun@example.com" maxLength={254} value={values.email} onChange={(e) => set("email", e.target.value)} />
              )}
            </Field>
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
                    <input type="radio" name="identity_type" value={t} checked={values.identity_type === t} onChange={() => { set("identity_type", t); set("identity_number", ""); }} className="sr-only" />
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
                  maxLength={values.identity_type === "aadhaar" ? 14 : 10}
                  value={values.identity_number}
                  onChange={(e) => set("identity_number", e.target.value)}
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
