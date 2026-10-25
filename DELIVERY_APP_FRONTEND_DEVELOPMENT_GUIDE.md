# Delivery Partner App — Frontend Development Guide

> **Project:** Organic Multi-Vendor Marketplace — Delivery Partner App  
> **Document status:** Frontend phase guide aligned to the source Delivery Partner scope  
> **Audience:** Frontend developer building the Delivery Partner App independently  
> **Scope authority:** `ORGANIC_MARKETPLACE_DELIVERY_APP_SCOPE.md`

---

## 0. READ THIS FIRST — Handoff and implementation boundaries

This guide translates the source's Delivery Partner Portal requirements into a frontend implementation plan.

### Current phase rules
- Backend/API/database integrations are not part of this frontend phase.
- Use typed mock data and local UI state to demonstrate workflows.
- Clearly label simulated job assignments, status updates, OTP/proof, notifications, and earnings. Never imply they were persisted or verified by a real service.
- Do not add delivery requirements that are not supported by the source. Put unresolved workflow decisions in the assumptions register.
- The source scope wins if this guide conflicts with it.
- Do not build Customer, Seller, Admin, or Super Admin portals.
- Review the reference UI image before final styling. Until it is reviewed, design tokens remain pending.

### Handoff package
1. `ORGANIC_MARKETPLACE_DELIVERY_APP_SCOPE.md`
2. `DELIVERY_APP_FRONTEND_DEVELOPMENT_GUIDE.md`
3. Reference UI theme image, when supplied (suggested path: `docs/reference/ui-theme.png`)

## A. Project overview

### Purpose
Let an approved delivery partner view assigned jobs, access necessary pickup/drop details, update delivery status, record failed-delivery reasons, use configured proof-of-delivery UI, and review delivery history and earnings where enabled.

### Recommended stack
Follow the existing repository if it has an established convention. If starting from scratch and consistent with the team setup:
- Next.js App Router
- React + TypeScript with `strict: true`
- Tailwind CSS
- Framer Motion for restrained motion
- React Context only for shared demo session/state where needed

Do not add state libraries, form libraries, or map packages without a concrete need. The source requires a navigation link; it does not by itself require embedded maps or live GPS tracking.

### Frontend responsibilities
**Current phase:** responsive layout, mock partner session, mock assigned-job list/details, local status transitions, failed-delivery reason/reattempt states, history, profile, and optional proof/earnings UI only when explicitly enabled.

**Not implemented in this phase:** real authentication, real job assignment, server-side authorization, live GPS/background location, route optimization, real OTP validation, real proof storage, persistent status updates, notification delivery, or actual earnings/payout processing.

| Current mock phase | Production dependency |
|---|---|
| Mock partner profile/availability | Partner account service and authorization |
| Fixture-based assigned jobs | Assignment service and delivery APIs |
| Local status changes | Server-side transition validation and persistence |
| Navigation link | Configured map/navigation destination and permissions |
| Simulated OTP/proof, only if enabled | Secure generation, validation, and storage |
| Mock failure/reattempt states | Configured exception and reassignment workflow |
| Mock history | Persisted delivery event history |
| Optional mock earnings | Recorded earnings rules and settlement data |
| Demo notifications | Notification service and configured provider |

## B. Pages and navigation

Implement the source-listed routes:

| Page | Route | Purpose |
|---|---|---|
| Delivery entry/redirect | `/delivery` | Correct demo landing state |
| Assigned jobs | `/delivery/jobs` | Current partner's assigned deliveries |
| Job details | `/delivery/jobs/[id]` | Pickup/drop details and permitted actions |
| Delivery history | `/delivery/history` | Current partner's past jobs |
| Partner profile | `/delivery/profile` | Profile and availability |

Do not create extra routes unless required by the source or existing repository. Use dialogs/drawers for secondary interactions where suitable.

### Shared app shell
- Mobile-first header with app identity, availability state, and profile access.
- Navigation to Jobs, History, and Profile.
- Visible “Demo mode — data is simulated” notice.
- Clear job status and prominent primary action.
- No Customer/Seller/Admin navigation.
- All navigation links must resolve to real routes.

### 1. Assigned jobs — `/delivery/jobs`
Display only the active mock partner's assigned jobs:
- Job/order reference and current status.
- Pickup and drop labels/addresses.
- Seller/customer contact options only when needed and present in the fixture.
- Time/slot only if present in the fixture.
- Primary action appropriate to the current status.
- Search/status filters only if useful and supported by fixture fields.

States: no assigned jobs, loading placeholder for future API integration, error/retry, and successful local status update.

### 2. Job details — `/delivery/jobs/[id]`
Display job reference, status, pickup/drop details, permitted contact options, navigation link, status timeline/history, and only actions valid for the current state. Show OTP/proof only when the demo explicitly enables it. Show failure reason/reattempt details where applicable.

Invalid or unassigned job IDs should show a friendly unavailable/not-found state. Do not reveal whether another partner's private job exists.

### 3. Delivery history — `/delivery/history`
- Show only jobs associated with the current mock partner.
- Include completed, failed, or returned jobs where fixture data exists.
- Show reference, date, final status, and useful summary details.
- Provide an empty state.
- Earnings are not a default history feature; include them only if explicitly chosen and enabled.

### 4. Partner profile — `/delivery/profile`
- Show profile fields available in mock data.
- Display availability.
- Allow a local demo availability toggle only if the workflow is intended to be represented.
- Label local-only changes.
- Do not collect unnecessary personal data or sensitive identity documents.

### 5. Entry route — `/delivery`
If a mock partner session exists, route to assigned jobs or show a simple delivery overview. Otherwise show a demo sign-in/partner-unavailable state consistent with the existing app. Do not add a real self-service account-creation flow; the source says accounts are Admin-created or approved.

## C. Mock data and types

### Rules
- Keep fixtures under `src/data/`, not inside page components.
- Use stable IDs and explicit `delivery_partner_id` ownership on every job.
- Filter jobs in a service layer for the active mock partner; do not merely hide other jobs visually.
- Use fictional contact details and addresses.
- Use source status values consistently.
- Include earnings, OTP, proof, coordinates, time slots, or contact details only when supported by the fixture and enabled for the demo.

### Suggested types
```ts
export type DeliveryStatus =
  | "assigned"
  | "accepted"
  | "arrived_at_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned";

export interface DeliveryPartnerProfile {
  id: string;
  name: string;
  phone?: string;
  availability_status: "available" | "unavailable";
}

export interface DeliveryJob {
  id: string;
  delivery_partner_id: string;
  order_reference: string;
  status: DeliveryStatus;
  pickup: {
    label: string;
    address: string;
    contact_name?: string;
    contact_phone?: string;
  };
  dropoff: {
    address: string;
    contact_name?: string;
    contact_phone?: string;
  };
  assigned_at: string;
  delivery_slot_label?: string;
  status_history: { status: DeliveryStatus; at: string }[];
  failed_reason?: string;
  reattempt_count?: number;
  proof_status?: "not_required" | "pending" | "verified" | "failed";
}
```
These are frontend demo models, not a finalized backend schema. Align with existing repository conventions. Add an earnings model only if partner earnings are enabled.

### Suggested fixture files
| File | Contents |
|---|---|
| `data/delivery-partner.ts` | One active demo partner and availability |
| `data/delivery-jobs.ts` | Jobs across statuses, with partner ownership |
| `data/delivery-history.ts` | Past jobs, if stored separately |
| `data/delivery-earnings.ts` | Only if earnings are enabled |
| `data/delivery-notifications.ts` | Only if notification UI is included |

Include a second fictional partner and jobs assigned to them only to test isolation.

## D. Mock session and access behavior

- Provide a demo-only partner session consistent with the existing project.
- Make the active mock partner ID explicit.
- Show “Demo mode — data is simulated”.
- Keep ownership filtering in the service layer.
- Changing the active mock partner must change visible jobs/history accordingly.
- Sign-out clears the mock session.
- Do not add real OAuth credentials or claim identity verification.
- This client-side mechanism is for UI demonstration only; production authorization must be server-side.

## E. Status workflow and interactions

Use the source status vocabulary:
`assigned`, `accepted`, `arrived_at_pickup`, `picked_up`, `out_for_delivery`, `delivered`, `failed`, `returned`.

The source does not fully specify every allowed transition. Use a conservative, documented demo transition map that can be revised when the business confirms the workflow.

Frontend rules:
- Show only actions appropriate to the current state.
- Block invalid transitions in a local helper.
- After a valid simulated update, update local state and append a timestamped history entry.
- Show confirmation only after local state changes.
- A failed job requires a selected/entered reason if that form is included.
- Label reattempt behavior as simulated; do not invent attempt limits.
- Do not allow editing order totals, item prices, or payment state.
- Do not show delivery as completed if configured demo proof has not been completed.

### Navigation link
- Use a navigation destination only when an address/coordinates are available.
- If no destination is configured, show the address and an unavailable/disabled navigation affordance.
- Do not imply live GPS tracking or route optimization.

### OTP/proof
- Include the UI only if the project explicitly enables this optional source feature.
- Use mock values and label them simulated.
- Never place real OTPs in fixtures.
- Do not call a mock proof state “verified by the platform.”

## F. Optional earnings and notifications

### Earnings
Only implement if the project enables delivery-partner earnings:
- Show recorded mock earning entries/statuses.
- Use one currency formatter and integer minor-unit money values.
- Do not invent a pay formula; the source does not specify one.
- Do not allow partners to edit earnings or mark payouts as paid.

### Notifications
If included, use mock records for assignment/status changes. Do not claim push, email, SMS, or WhatsApp messages were delivered. Real channels require a configured provider and backend service.

## G. Reference image and design system

**Status: pending until the reference UI theme image is reviewed.**

Before final styling:
- Extract colors, font family, typography, spacing, radii, shadows, and responsive behavior.
- Store tokens in `src/config/design-tokens.ts` or the existing project's equivalent.
- Use semantic tokens, not scattered raw hex values.
- Prioritize legibility, clear status hierarchy, and easy one-handed use.
- Use text with status colors; never rely on color alone.
- Use a consistent icon library, not emoji as interface icons.
- Avoid excessive gradients, clutter, oversized empty areas, and distracting animations.
- Ensure adequate contrast and visible focus states.

## H. Motion and interaction design

Add motion after layout and core workflows are stable:
- Subtle transition when a job status changes.
- Drawer/menu transitions on mobile.
- Restrained confirmation/toast transitions.
- Respect reduced-motion preferences.
- Prefer opacity/transform and avoid animations that delay urgent actions.

## I. Component architecture

Suggested reusable components:
- `DeliveryAppShell`, `DeliveryHeader`, `DeliveryMobileNav`
- `PartnerAvailabilityControl`, `DemoModeNotice`
- `DeliveryJobCard`, `DeliveryJobList`, `DeliveryJobDetails`
- `DeliveryStatusBadge`, `DeliveryStatusActions`, `DeliveryStatusTimeline`
- `PickupDropoffCard`, `NavigationLink`
- `FailureReasonForm`, `ReattemptPanel`
- `ProofOfDeliveryPanel` (optional/configured only)
- `DeliveryHistoryList`, `DeliveryProfileForm`
- `EarningsSummary` (optional)
- `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `ConfirmDialog`

Keep components focused and typed. Keep transition rules and data access outside JSX.

## J. Suggested folder structure

```text
src/
├── app/
│   ├── delivery/
│   │   ├── page.tsx
│   │   ├── jobs/page.tsx
│   │   ├── jobs/[id]/page.tsx
│   │   ├── history/page.tsx
│   │   └── profile/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── delivery/
│   └── feedback/
├── data/
├── types/
├── services/       # Mock delivery data and status helpers
├── context/        # Demo partner session if shared
├── lib/            # transitions, validation, formatting
└── config/         # design tokens and motion constants
```
Adjust to existing repository conventions. Do not create empty files/routes just to match this tree.

## K. State and mock service rules

- Pages use a small `services/` layer to read/update mock data.
- Suggested functions: `getCurrentDeliveryPartner()`, `getAssignedJobs(partnerId)`, `getDeliveryJobById(partnerId, jobId)`, `updateMockDeliveryStatus(partnerId, jobId, nextStatus)`, `recordMockFailure(partnerId, jobId, reason)`, and `getDeliveryHistory(partnerId)`.
- Every job lookup must verify `delivery_partner_id` matches the active mock partner.
- Derive counts and filtered lists from fixtures/state rather than duplicating state.
- Use local state/context for filters, dialogs, profile drafts, and demo session.
- Optional browser persistence is temporary demo continuity only.
- Do not invent API endpoint URLs or backend contracts.

## L. Responsive design and accessibility

- Mobile-first layouts suitable for small screens.
- Primary job action must be easy to find and tap.
- Use readable address text and comfortable touch targets.
- Use semantic landmarks, clear heading hierarchy, visible labels, and accessible validation.
- Ensure keyboard-accessible menus/dialogs and visible focus states.
- Do not rely on color alone for status.
- Respect reduced motion.
- Do not request live location permissions unless that feature is separately approved and scoped.

## M. Error handling and edge cases

Cover:
- No assigned jobs.
- Invalid job ID or a job belonging to another partner.
- Invalid status transition.
- Missing pickup/drop/contact data.
- Navigation destination not configured.
- Failed delivery without a reason.
- Reattempt state without confirmed reattempt rules.
- Optional proof/OTP pending, failed, or not configured.
- Empty history.
- Earnings disabled or no earnings data.
- Local update failure; show an error and avoid false success.
- Mobile layout overflow and unknown routes.
- No other partner's data leaks into lists, details, history, or search results.

## N. Testing and frontend acceptance criteria

### Required checks for the current mock frontend phase
1. Every source-listed Delivery route loads and navigation links work.
2. Active mock partner sees only their assigned jobs.
3. Opening another partner's job shows a safe unavailable/not-found state.
4. Pickup/drop/contact information is limited to the fixture data needed for the job.
5. Status actions match the documented demo transition map.
6. Invalid transitions are blocked with a clear message.
7. Successful local status changes append timestamped mock history.
8. Failed-delivery reason and reattempt UI work if included.
9. OTP/proof appears only when enabled and never claims real verification.
10. History is filtered to the active partner.
11. Earnings are omitted when disabled; when enabled, values match fixtures.
12. No UI action edits order totals or payment state.
13. Empty, loading, error, and success states work.
14. Mobile/tablet/desktop layouts remain usable.
15. Keyboard navigation, labels, focus states, and reduced motion are checked.
16. No dead links, broken images, console errors, or TypeScript/ESLint errors.
17. Demo notices make simulated behavior clear.
18. No real customer data, OTPs, secrets, or sensitive information are included in fixtures.

### Production tests deferred until backend exists
- Server-side assignment ownership authorization.
- Real status persistence and concurrency handling.
- OTP/proof generation, validation, storage, and audit.
- Failed-delivery/reassignment rules.
- Notification delivery.
- Earnings calculation and settlement integration.
- API/database/security integration and end-to-end delivery tests.

Passing the frontend checklist does not mean the full marketplace's production acceptance criteria have passed.

## O. Implementation phases

### Phase 1 — Scope and foundation
Review scope, repository, and reference image. Build app shell, routes, tokens, and demo partner session.
**Acceptance:** route shells render; no final theme values are invented before reference review.

### Phase 2 — Assigned jobs and details
Create fixtures and partner-filtered mock services. Implement job list/details, pickup/drop cards, and navigation affordance.
**Acceptance:** only assigned jobs are visible and unassigned IDs are safely handled.

### Phase 3 — Status updates and exception flow
Implement demo transitions, timeline entries, failure reasons, and optional reattempt/proof states.
**Acceptance:** invalid transitions are blocked and all local updates are clearly simulated.

### Phase 4 — History, profile, and optional features
Implement history and profile/availability. Add earnings or notifications only if enabled.
**Acceptance:** optional features are not presented as mandatory source requirements.

### Phase 5 — Quality pass
Test responsive behavior, accessibility, privacy, edge cases, and build/lint/type checks.
**Acceptance:** frontend checklist passes; production-only requirements are documented as deferred.

## P. Requirements and assumptions register

| Item | Source status / implementation note | Follow-up |
|---|---|---|
| Delivery routes | Source lists five routes in Section B | Align with repository |
| Account creation | Admin-created or approved | Confirm production onboarding |
| Availability | Required profile capability; exact rules unspecified | Confirm toggle rules |
| Job assignment | Assigned jobs only | Confirm accept/decline/reassignment |
| Status sequence | Source status vocabulary in Section E | Confirm allowed transitions/overrides |
| Navigation | Navigation link required | Confirm provider/destination format |
| OTP/proof | If configured | Confirm proof method |
| Failed delivery | Failure reason and reattempt workflow required | Confirm reasons, limits, permissions |
| Delivery history | Required | Confirm retention/display fields |
| Earnings | Only if partners are paid through platform | Confirm formula and settlement policy |
| Notifications | Assignment/status updates identified by source | Confirm channels/provider |
| Live GPS/background tracking | Not specified | Do not implement without approval |
| Offline mode | Not specified | Confirm only if required |
| Reference UI image | Pending until supplied/reviewed | Extract tokens before final styling |
| Backend/API/database | Out of current frontend phase | Replace mock services when contracts exist |
| Deviations | Record scope changes | Explain reason and approval |

## Q. Definition of done

The frontend phase is done when:
- All required source-listed delivery routes are navigable.
- Assigned jobs, details, status controls, history, and profile work against mock data.
- The active partner cannot see another partner's jobs through the UI/service layer.
- Failure and optional proof flows are clearly simulated.
- Responsive and accessibility checks are complete.
- No dead controls, false success claims, or misleading real-tracking/payment/payout labels remain.
- Type checking, linting, and production build pass, or blockers are recorded.
- Production integrations and security checks are documented as deferred.
