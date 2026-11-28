import { ApiRequestError, apiFetch, DELIVERY_API } from "@/config/api";
import { clearStoredSession, readTokens, saveTokens } from "@/services/delivery-api";

export type VehicleType = "bike" | "scooter" | "ev";
export type IdentityType = "aadhaar" | "pan";

/** The body of POST /api/v1/delivery/auth/register. */
export interface DeliveryRegistrationInput {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  vehicle_type: VehicleType;
  vehicle_number: string;
  driving_license: string;
  bank_account: string;
  ifsc: string;
  identity_type: IdentityType;
  identity_number: string;
  // From verifyOtp("phone" | "email"); registration uses them up.
  phone_verification_token: string;
  email_verification_token: string;
}

export type OtpChannel = "phone" | "email";

export interface DeliveryPartnerProfile {
  partner_id: string;
  user_id: string;
  full_name: string;
  // Partners are created by the Super Admin, who may leave the optional details empty.
  email: string | null;
  phone: string;
  vehicle_type: VehicleType | null;
  vehicle_number: string | null;
  driving_license_number: string | null;
  bank_account_last4: string | null;
  ifsc_code: string | null;
  identity_type: IdentityType | null;
  identity_last4: string | null;
  approval_status: "pending" | "approved" | "rejected";
  availability_status: "available" | "unavailable";
  account_status?: "active" | "suspended";
  // The Super Admin issued the password: the app asks for a new one before anything else.
  must_change_password?: boolean;
  pincodes?: string[];
}

/** Shown on the sign-in screen when the Super Admin has suspended the account. */
export const ACCOUNT_SUSPENDED = "Account suspended — contact Super Admin.";

/** A 403 from sign-in or any request: the account is suspended (or not active). */
export const isAccountBlocked = (error: ApiRequestError) =>
  error.status === 403 && /suspended|not active/i.test(error.message);

export interface DeliveryAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  partner: DeliveryPartnerProfile;
}

export type RegistrationField =
  | Exclude<keyof DeliveryRegistrationInput, "phone_verification_token" | "email_verification_token">
  | "code";

export class RegistrationError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Partial<Record<RegistrationField, string>> = {}
  ) {
    super(message);
  }
}

/** Emails are compared and stored trimmed and lower-case, for every domain (.in, .ac.in, .co.in, ...). */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Registers the partner on the shared backend and keeps the returned tokens.
 * Turns the backend's errors into one message per form field.
 */
export async function registerDeliveryPartner(input: DeliveryRegistrationInput): Promise<DeliveryPartnerProfile> {
  try {
    const response = await apiFetch<DeliveryAuthResponse>(DELIVERY_API.register, {
      method: "POST",
      body: { ...input, email: normalizeEmail(input.email) },
    });
    saveTokens(response);
    return response.partner;
  } catch (error) {
    throw error instanceof ApiRequestError ? toRegistrationError(error) : unreachable();
  }
}

/** POST /delivery/auth/login with the email the Super Admin registered; keeps the tokens. */
export async function loginDeliveryPartner(email: string, password: string): Promise<DeliveryPartnerProfile> {
  try {
    const response = await apiFetch<DeliveryAuthResponse>(DELIVERY_API.login, {
      method: "POST",
      body: { identifier: normalizeEmail(email), password },
    });
    saveTokens(response);
    return response.partner;
  } catch (error) {
    if (!(error instanceof ApiRequestError)) throw unreachable();
    if (error.status === 401) throw new RegistrationError("Email or password is incorrect.");
    if (isAccountBlocked(error)) throw new RegistrationError(ACCOUNT_SUSPENDED);
    throw new RegistrationError(error.message || "Sign-in failed. Please try again.");
  }
}

/** POST /delivery/auth/forgot-password: emails a 6-digit code (the answer never says whether the email exists). */
export async function requestPasswordReset(email: string): Promise<number> {
  try {
    const r = await apiFetch<{ sent: boolean; expiresInSeconds: number }>(DELIVERY_API.forgotPassword, {
      method: "POST",
      body: { email: normalizeEmail(email) },
    });
    return r.expiresInSeconds;
  } catch (error) {
    if (!(error instanceof ApiRequestError)) throw unreachable();
    throw new RegistrationError(error.message || "The code couldn't be sent. Please try again.");
  }
}

/** POST /delivery/auth/reset-password with the emailed code. */
export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  try {
    await apiFetch(DELIVERY_API.resetPassword, {
      method: "POST",
      body: { email: normalizeEmail(email), otp: otp.trim(), new_password: newPassword },
    });
  } catch (error) {
    if (!(error instanceof ApiRequestError)) throw unreachable();
    throw new RegistrationError(error.message || "The password couldn't be reset. Please try again.");
  }
}

/** The app's rule for a new password, the same as the backend's: 10+ characters with letters and numbers. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Use both letters and numbers.";
  return null;
}

/** Ends the server session (best effort) and forgets the stored session. */
export async function logoutDeliveryPartner(): Promise<void> {
  const refresh = readTokens()?.refresh;
  clearStoredSession();
  if (refresh) await apiFetch(DELIVERY_API.logout, { method: "POST", body: { refresh_token: refresh } }).catch(() => undefined);
}

const FIELDS: RegistrationField[] = [
  "full_name", "email", "phone", "password", "vehicle_type", "vehicle_number",
  "driving_license", "bank_account", "ifsc", "identity_type", "identity_number", "code",
];

export interface SentOtp {
  expires_in: number;
  resend_in: number;
  // Only when the backend runs with DELIVERY_OTP_SENDER=dev (no SMS provider is connected yet).
  dev_code?: string | null;
}

const OTP = {
  phone: { send: DELIVERY_API.sendOtp, verify: DELIVERY_API.verifyOtp, token: "phone_verification_token" },
  email: { send: DELIVERY_API.sendEmailOtp, verify: DELIVERY_API.verifyEmailOtp, token: "email_verification_token" },
} as const;

/** POST /delivery/auth/send-otp (SMS) or /send-email-otp: sends a 6-digit code. */
export async function sendOtp(channel: OtpChannel, destination: string): Promise<SentOtp> {
  try {
    return await apiFetch<SentOtp>(OTP[channel].send, { method: "POST", body: { [channel]: destination } });
  } catch (error) {
    throw error instanceof ApiRequestError ? toRegistrationError(error) : unreachable();
  }
}

/** POST /delivery/auth/verify-otp or /verify-email-otp: returns the token that registration needs. */
export async function verifyOtp(channel: OtpChannel, destination: string, code: string): Promise<string> {
  try {
    const r = await apiFetch<Record<string, string>>(OTP[channel].verify, {
      method: "POST",
      body: { [channel]: destination, code },
    });
    return r[OTP[channel].token];
  } catch (error) {
    throw error instanceof ApiRequestError ? toRegistrationError(error) : unreachable();
  }
}

const unreachable = () =>
  new RegistrationError("We couldn’t reach the Mithren Agro server. Check your connection and try again.");

function toRegistrationError(error: ApiRequestError): RegistrationError {
  const detail = (error.body as { detail?: unknown } | null)?.detail;
  const fieldErrors: Partial<Record<RegistrationField, string>> = {};
  // 422: FastAPI's list of validation errors, each with its field in loc.
  if (Array.isArray(detail)) {
    for (const item of detail as { loc?: unknown[]; msg?: string }[]) {
      const field = item.loc?.[item.loc.length - 1];
      const message = (item.msg ?? "Check this field.").replace(/^Value error, /, "");
      const key = FIELDS.includes(field as RegistrationField) ? (field as RegistrationField) : "identity_number";
      fieldErrors[key] ??= message;
    }
    return new RegistrationError("Please fix the highlighted fields.", fieldErrors);
  }
  // 409 and other errors: {"message", "field"}.
  if (detail && typeof detail === "object" && "message" in detail) {
    const { message, field } = detail as { message: string; field?: string | null };
    if (field && FIELDS.includes(field as RegistrationField)) fieldErrors[field as RegistrationField] = message;
    return new RegistrationError(message, fieldErrors);
  }
  if (error.status === 503) return new RegistrationError("Registration is unavailable right now. Please try again shortly.");
  return new RegistrationError(error.message || "Registration failed. Please try again.");
}
