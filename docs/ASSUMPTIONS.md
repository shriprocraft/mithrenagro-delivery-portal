# Demo Assumptions and Open Business Questions

This file records frontend-demo-only decisions made while building the Delivery Partner
Portal. It does **not** modify or supersede `ORGANIC_MARKETPLACE_DELIVERY_APP_SCOPE.md`
or `DELIVERY_APP_FRONTEND_DEVELOPMENT_GUIDE.md`, which remain the source of truth and
are unchanged.

## Demo-only decisions

| Area | Decision for this phase | Status |
|---|---|---|
| Status transitions | Conservative forward map: `assigned → accepted → arrived_at_pickup → picked_up → out_for_delivery → delivered`/`failed`. From `failed`: reattempt (→ `out_for_delivery`, increments `reattempt_count`) or mark returned (→ `returned`). Defined in `src/lib/status-transitions.ts`. | Provisional demo assumption, not a confirmed business rule |
| Failure point | Failure is modeled as occurring only from `out_for_delivery` (a failed delivery attempt). Earlier failure points (e.g. a failed pickup) are not modeled. | Provisional, unconfirmed |
| Failed-delivery reasons | Small fixed placeholder list in `src/lib/failure-reasons.ts` ("Customer unavailable", "Address not found", "Customer refused delivery", "Access issue at delivery location", "Other"). | Provisional placeholder, pending business confirmation |
| Reattempt limit | No maximum enforced. `reattempt_count` is shown and increments on each simulated reattempt. | Simulated, intentionally uncapped |
| Returned path | Modeled as reachable only from `failed` (an exhausted-attempts path), not from `delivered` (post-delivery returns are not described in the source). | Provisional, unconfirmed |
| OTP / proof of delivery | Omitted entirely this phase — the source says "if configured"; there is no confirmation it is enabled. | Deferred |
| Earnings | Omitted entirely this phase — pay formula and settlement rules are unspecified. | Deferred |
| Notifications | Omitted entirely this phase — channels and delivery guarantees are unspecified. | Deferred |
| Availability toggle | Local demo state only (`src/context/delivery-session-context.tsx`). Never updates job assignments, never touches job data. | Simulated, UI-only |
| History derivation | Derived from the same job fixtures by filtering terminal statuses (`delivered`, `returned`) rather than a separate duplicated fixture — see `getDeliveryHistory` in `src/services/delivery-service.ts`. A reattempted job stays a single record and appears in history exactly once, when it finally reaches a terminal status. | Implementation choice, not a business rule |
| Navigation link | Opens the drop-off address in an external maps search (no embedded map, no live GPS, no route optimization). | Per scope — navigation link only |
| Design tokens | Colors, spacing, and radii in `src/config/design-tokens.ts` are visually approximated from `references/ui-theme.png` (the Mithren Agro customer marketplace homepage, supplied as the brand/visual reference). Not confirmed official brand values — no brand guideline document, hex palette, or font license was supplied. The font is a close visual substitute, not an asserted official brand typeface. | Approximation, pending brand confirmation |

## Open business questions (not invented, require confirmation before production)

- Exact profile fields and availability rules beyond what's shown here.
- Assignment accept/decline, reassignment, and cancellation rules.
- Whether OTP, photo, signature, or another proof method will be enabled, and its process.
- Final allowed failed-delivery reasons and any real reattempt limit.
- Partner earnings formula, payment schedule, and settlement workflow (and whether
  earnings are enabled at all).
- Notification channels and delivery guarantees.
- Full status-transition rules and who may override them in production.
- Whether a delivery can be returned after reaching "delivered" (not modeled here).
- Offline operation, live GPS tracking, route optimization, or background location
  (none implemented here).
- Confirmed official brand colors/typography (current tokens are visual approximations
  only).

## Production dependencies not implemented in this phase

Real authentication, server-side authorization, persistent database storage, live
GPS/background location, real OTP/proof generation and validation, real notification
delivery, and real earnings/payout processing. See the frontend guide's dependency table
(Section A) for the full list.
