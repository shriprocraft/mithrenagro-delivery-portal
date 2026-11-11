import { ApiRequestError, apiFetch, DELIVERY_API } from "@/config/api";

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
  // From verifyPhoneOtp(); registration uses it up.
  phone_verification_token: string;
}

export interface DeliveryPartnerProfile {
  partner_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: VehicleType;
  vehicle_number: string;
  driving_license_number: string;
  bank_account_last4: string;
  ifsc_code: string;
  identity_type: IdentityType;
  identity_last4: string;
  approval_status: "pending" | "approved" | "rejected";
  availability_status: "available" | "unavailable";
}

interface DeliveryAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  partner: DeliveryPartnerProfile;
}

export type RegistrationField = Exclude<keyof DeliveryRegistrationInput, "phone_verification_token"> | "code";

export class RegistrationError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Partial<Record<RegistrationField, string>> = {}
  ) {
    super(message);
  }
}

const TOKENS_KEY = "mithren.delivery.tokens";

/**
 * Registers the partner on the shared backend and keeps the returned tokens for the signed-in
 * session (sign-in still uses the demo accounts until it is connected to the backend too).
 * Turns the backend's errors into one message per form field.
 */
export async function registerDeliveryPartner(input: DeliveryRegistrationInput): Promise<DeliveryPartnerProfile> {
  try {
    const response = await apiFetch<DeliveryAuthResponse>(DELIVERY_API.register, { method: "POST", body: input });
    try {
      localStorage.setItem(TOKENS_KEY, JSON.stringify({ access: response.access_token, refresh: response.refresh_token }));
    } catch {
      /* private mode: the partner signs in again later */
    }
    return response.partner;
  } catch (error) {
    throw error instanceof ApiRequestError ? toRegistrationError(error) : unreachable();
  }
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

/** POST /delivery/auth/send-otp: texts a 6-digit code to the number. */
export async function sendPhoneOtp(phone: string): Promise<SentOtp> {
  try {
    return await apiFetch<SentOtp>(DELIVERY_API.sendOtp, { method: "POST", body: { phone } });
  } catch (error) {
    throw error instanceof ApiRequestError ? toRegistrationError(error) : unreachable();
  }
}

/** POST /delivery/auth/verify-otp: returns the token that registration needs. */
export async function verifyPhoneOtp(phone: string, code: string): Promise<string> {
  try {
    const r = await apiFetch<{ phone_verification_token: string }>(DELIVERY_API.verifyOtp, {
      method: "POST",
      body: { phone, code },
    });
    return r.phone_verification_token;
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
