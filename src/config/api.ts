/**
 * Where the Delivery Partner Portal reaches the shared Mithren Agro FastAPI backend.
 *
 * Set NEXT_PUBLIC_API_BASE_URL in .env.local (see .env.example); it defaults to the local backend
 * on port 8000. Every request goes through apiUrl() / apiFetch(), so changing the backend is a
 * one-line config change.
 *
 * The portal still runs on demo data (src/services/delivery-service.ts and mock-auth.ts): the
 * backend has no delivery-partner endpoints yet. DELIVERY_API lists the endpoints the screens
 * will need, so each mock call can be swapped for apiFetch() once they exist.
 */

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
export const API_PREFIX = "/api/v1";

/** Absolute URL for an API path, e.g. apiUrl("/delivery/jobs") -> http://127.0.0.1:8000/api/v1/delivery/jobs */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown = null
  ) {
    super(message);
  }
}

/** JSON request to the backend. Sends the bearer token when one is given; throws ApiRequestError on non-2xx. */
export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token }: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = (data as { detail?: { message?: string } | string } | null)?.detail;
    const message = typeof detail === "string" ? detail : detail?.message ?? `Request failed (${response.status})`;
    throw new ApiRequestError(response.status, message, data);
  }
  return data as T;
}

/** The backend's liveness check (outside /api/v1). True when the backend answers. */
export async function backendIsUp(): Promise<boolean> {
  try {
    return (await fetch(`${API_BASE_URL}/health`)).ok;
  } catch {
    return false;
  }
}

/**
 * Endpoints the delivery screens need. The auth endpoints exist; the rest are the contract still to
 * build, derived from the mock service functions each screen calls today.
 */
export const DELIVERY_API = {
  // Implemented on the backend (delivery-app-api):
  sendOtp: "/delivery/auth/send-otp", //            POST  {phone} -> {expires_in, resend_in, dev_code?}
  verifyOtp: "/delivery/auth/verify-otp", //        POST  {phone, code} -> {phone_verification_token}
  sendEmailOtp: "/delivery/auth/send-email-otp", // POST  {email} -> {expires_in, resend_in, dev_code?}
  verifyEmailOtp: "/delivery/auth/verify-email-otp", // POST {email, code} -> {email_verification_token}
  register: "/delivery/auth/register", //           POST  registration form -> tokens + profile   (/delivery/register)
  login: "/delivery/auth/login", //                 POST  {identifier, password} -> tokens + profile
  refresh: "/delivery/auth/refresh", //             POST  {refresh_token} -> new token pair
  logout: "/delivery/auth/logout", //               POST  {refresh_token}                 (sign out)
  me: "/delivery/auth/me", //                       GET   partner profile (restores the session on reload)
  orders: "/delivery/orders", //                    GET   ?status=&limit=&offset= -> the partner's orders (/delivery/jobs, /history)
  order: (id: string) => `/delivery/orders/${encodeURIComponent(id)}`, //              GET   one order in full; 403 if not assigned
  orderStatus: (id: string) => `/delivery/orders/${encodeURIComponent(id)}/status`, // PATCH {status, expected_status}
  availability: "/delivery/profile/availability", // PATCH {availability_status}          (profile page)
  // Not implemented on the backend yet (demo partners only): failed deliveries, reattempts and returns.
} as const;
