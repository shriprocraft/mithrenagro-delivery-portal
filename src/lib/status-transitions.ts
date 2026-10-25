import type { DeliveryStatus } from "@/types/delivery";

/**
 * DEMO ASSUMPTION — not a confirmed business rule.
 *
 * ORGANIC_MARKETPLACE_DELIVERY_APP_SCOPE.md defines the status vocabulary but does not
 * fully specify every allowed transition. This is a conservative, documented demo
 * transition map, kept isolated here so it can be revised without touching components
 * or services once the business confirms the real workflow. See docs/ASSUMPTIONS.md.
 *
 * Failure is modeled as a delivery-attempt failure, reachable only from
 * "out_for_delivery" — earlier failure points (e.g. a failed pickup) are not modeled.
 * From "failed", the demo offers two distinct exception-path actions (handled by
 * recordMockReattempt / recordMockReturn in services/delivery-service.ts, not this
 * generic map): reattempt (back to "out_for_delivery") or give up (to "returned").
 */
export const ALLOWED_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  assigned: ["accepted"],
  accepted: ["arrived_at_pickup"],
  arrived_at_pickup: ["picked_up"],
  picked_up: ["out_for_delivery"],
  out_for_delivery: ["delivered", "failed"],
  delivered: [],
  failed: ["out_for_delivery", "returned"],
  returned: [],
};

export function isValidTransition(current: DeliveryStatus, next: DeliveryStatus): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}

export function getNextActions(current: DeliveryStatus): DeliveryStatus[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}
