import { ApiRequestError, apiFetch, DELIVERY_API } from "@/config/api";
import type { DeliveryJob, DeliveryStatus } from "@/types/delivery";
import type { DeliveryPartnerProfile as BackendPartnerProfile } from "@/services/delivery-registration";

/**
 * The signed-in session, kept in localStorage so it survives page reloads until the partner signs out:
 * - mithren.delivery.tokens: the backend access and refresh tokens (registered partners);
 * - mithren.delivery.session: who is signed in (a registered partner's profile, or a demo partner id).
 * Every read and write is guarded: private browsing or blocked storage just means no persistence.
 */
const TOKENS_KEY = "mithren.delivery.tokens";
const SESSION_KEY = "mithren.delivery.session";

export type StoredSession = { kind: "demo"; partnerId: string } | { kind: "backend"; profile: BackendPartnerProfile };

interface Tokens {
  access: string;
  refresh: string;
}

function read<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the session lasts until the page is closed */
  }
}

export function saveTokens(pair: { access_token: string; refresh_token: string }) {
  write(TOKENS_KEY, { access: pair.access_token, refresh: pair.refresh_token } satisfies Tokens);
}

export function readTokens(): Tokens | null {
  const t = read<Tokens>(TOKENS_KEY);
  return t && typeof t.access === "string" && typeof t.refresh === "string" ? t : null;
}

export const saveSession = (session: StoredSession) => write(SESSION_KEY, session);
export const readSession = () => read<StoredSession>(SESSION_KEY);

export function clearStoredSession() {
  try {
    localStorage.removeItem(TOKENS_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing stored */
  }
}

/** The backend no longer accepts the session (refresh token expired or revoked): sign in again. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Sign in again.");
  }
}

let refreshing: Promise<boolean> | null = null;

/** Swaps the refresh token for a new pair. Concurrent callers share one request. */
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const t = readTokens();
    if (!t) return false;
    try {
      saveTokens(
        await apiFetch<{ access_token: string; refresh_token: string }>(DELIVERY_API.refresh, {
          method: "POST",
          body: { refresh_token: t.refresh },
        })
      );
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** A request with the partner's access token. A 401 refreshes the tokens once and retries. */
async function authFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const tokens = readTokens();
  if (!tokens) throw new SessionExpiredError();
  try {
    return await apiFetch<T>(path, { ...options, token: tokens.access });
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401) throw error;
    if (!(await refreshTokens())) {
      clearStoredSession();
      throw new SessionExpiredError();
    }
    return apiFetch<T>(path, { ...options, token: readTokens()!.access });
  }
}

// ---------- orders ----------

interface BackendJob {
  order_id: string;
  order_number: string;
  delivery_status: "assigned" | "out_for_delivery" | "delivered" | "cancelled";
  next_statuses: DeliveryStatus[];
  assigned_at: string;
  delivered_at: string | null;
  payment_method: "online" | "cod";
  pickup: {
    shop_name: string;
    phone: string;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  };
  dropoff: {
    customer_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    instructions: string | null;
    slot: string | null;
  };
}

const joinAddress = (...parts: (string | null)[]) => parts.filter(Boolean).join(", ");

/** A backend order in the shape the job screens use. */
export function toDeliveryJob(job: BackendJob, partnerId: string): DeliveryJob {
  // The backend keeps when the order was assigned and delivered; other steps have no time of their own yet.
  const history: DeliveryJob["status_history"] = [{ status: "assigned", at: job.assigned_at }];
  if (job.delivery_status !== "assigned") history.push({ status: job.delivery_status, at: job.delivered_at ?? job.assigned_at });
  return {
    id: job.order_id,
    delivery_partner_id: partnerId,
    order_reference: job.order_number,
    status: job.delivery_status,
    pickup: {
      label: job.pickup.shop_name,
      address: joinAddress(job.pickup.address_line1, job.pickup.city, job.pickup.state, job.pickup.pincode) || job.pickup.shop_name,
      contact_name: job.pickup.shop_name,
      contact_phone: job.pickup.phone,
    },
    dropoff: {
      address: joinAddress(job.dropoff.address, job.dropoff.city, job.dropoff.state, job.dropoff.pincode),
      contact_name: job.dropoff.customer_name,
      contact_phone: job.dropoff.phone,
    },
    assigned_at: job.assigned_at,
    delivery_slot_label: job.dropoff.slot ?? undefined,
    status_history: history,
    reattempt_count: 0,
    source: "backend",
    next_statuses: job.next_statuses,
    payment_method: job.payment_method,
  };
}

export const deliveryApi = {
  me: () => authFetch<BackendPartnerProfile>(DELIVERY_API.me),

  /** Every order assigned to the partner (active and completed), newest first. */
  async orders(partnerId: string): Promise<DeliveryJob[]> {
    const jobs: DeliveryJob[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await authFetch<{ items: BackendJob[]; total: number }>(`${DELIVERY_API.orders}?limit=100&offset=${offset}`);
      jobs.push(...page.items.map((j) => toDeliveryJob(j, partnerId)));
      if (jobs.length >= page.total || page.items.length === 0) return jobs;
    }
  },

  async setStatus(partnerId: string, job: DeliveryJob, status: DeliveryStatus): Promise<DeliveryJob> {
    const updated = await authFetch<BackendJob>(DELIVERY_API.orderStatus(job.id), {
      method: "PATCH",
      // expected_status: refused if the order changed meanwhile (for example, on another device).
      body: { status, expected_status: job.status },
    });
    return toDeliveryJob(updated, partnerId);
  },

  setAvailability: (availability_status: "available" | "unavailable") =>
    authFetch<BackendPartnerProfile>(DELIVERY_API.availability, { method: "PATCH", body: { availability_status } }),
};
