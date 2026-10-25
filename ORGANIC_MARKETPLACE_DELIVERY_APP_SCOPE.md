# Delivery Partner App — Scope Document

> **Project:** Organic Fruits & Vegetables Multi-Vendor Marketplace  
> **Source:** `GLM_Organic_MultiVendor_Marketplace_Prompt.md` — Module D, shared role/permission requirements, notifications, multi-vendor order architecture, routes, and testing criteria.  
> **Scope boundary:** Delivery Partner App only. Customer, Seller, Admin, and Super Admin screens are excluded except where they are dependencies for delivery operations.

## 1. Purpose

Provide a dedicated Delivery Partner App/Portal where approved partners can view and manage only deliveries assigned to them, access the pickup/drop details needed to complete those deliveries, update delivery status, record proof or failure reasons where configured, and review delivery history and earnings where applicable.

The master source describes a production-oriented marketplace with persistent data and server-side authorization. This document preserves those requirements; it does not redefine production scope as mock-only.

## 2. Delivery Partner role and access

- Delivery partner accounts are Admin-created or approved through the platform's configured process.
- A partner can access assigned deliveries only.
- Show only the minimum customer/seller personal data needed to complete an assigned delivery.
- Seller/customer contact options may be shown when needed for fulfilment.
- Partners must not access unassigned jobs, unrelated orders, or another partner's private information.
- Partners cannot edit order totals, item prices, payment state, seller earnings, commissions, or settlement records.
- Production authorization must be enforced server-side; hiding controls in the UI is not sufficient.

## 3. Partner profile and availability

- Partner profile.
- Availability status and the ability to view/update it where permitted by the configured workflow.
- Profile details needed for delivery operations.

Account creation and approval are platform/Admin dependencies. Admin account-management screens are outside this scope.

## 4. Assigned deliveries and job details

Provide a list of deliveries assigned to the current partner and details for each assigned job, including:
- Pickup details.
- Drop-off details.
- Seller/customer contact options when needed.
- A navigation link.
- Job reference, current status, and relevant status history where available.

Do not expose unrelated personal information. A partner must not be able to open an unassigned delivery by changing a URL or identifier.

## 5. Delivery status updates

The source-defined status vocabulary is:
1. Assigned
2. Accepted
3. Arrived at pickup
4. Picked up
5. Out for delivery
6. Delivered
7. Failed
8. Returned

Show the current status clearly and provide only valid actions for the current job/workflow. Production status changes must be validated and persisted by the backend with timestamps and appropriate history.

## 6. Delivery OTP or proof of delivery

- Support delivery OTP or proof of delivery **if configured**.
- Do not require or display a proof workflow unless the platform has enabled it.
- Do not represent a delivery as verified if the configured verification step has not succeeded.
- Handle proof data with appropriate privacy and access controls.

The exact proof type, OTP process, photo/signature requirements, and retention rules are not specified by the source and need confirmation before production implementation.

## 7. Failed delivery and reattempts

- Provide a way to record a failed delivery reason.
- Support a reattempt workflow.
- Display the resulting job state clearly.
- Do not allow a failed delivery to be silently marked delivered.

The source does not specify permitted failure reasons, maximum attempts, rescheduling rules, or who may reassign a delivery. Confirm these before production implementation.

## 8. Delivery history and earnings

- Provide delivery history for the current partner.
- Show earnings only **if delivery partners are paid through the platform**.
- If enabled, show earnings using recorded platform data and configured rules.
- Do not invent earnings amounts or display a payout as completed without a recorded successful settlement.
- Partners cannot edit earnings, platform fees, order totals, or payout states.

The source does not specify a delivery-partner pay formula. Confirm it if earnings are enabled.

## 9. Delivery-related notifications

The platform notification service identifies delivery assignment and delivery updates as notification events. Relevant partner-facing notifications may include:
- New delivery assignment.
- Assignment or status changes affecting an assigned delivery.

Channels depend on configured providers. Do not claim a notification was sent if the provider is not configured or delivery has not been confirmed.

## 10. Source-listed routes

- `/delivery`
- `/delivery/jobs`
- `/delivery/jobs/[id]`
- `/delivery/history`
- `/delivery/profile`

All navigation links must resolve to real pages or documented redirects. Landing behavior for `/delivery` should follow the configured authentication and partner-account state.

## 11. Platform dependencies (not this app's scope)

- Admin-created/approved partner accounts and delivery assignment.
- Seller pickup/readiness information.
- Customer address and permitted contact information.
- Parent orders and vendor-specific sub-orders for multi-vendor checkout.
- Delivery zones, serviceability, delivery slots, capacity, and fees configured by the platform.
- Notification service, authentication, authorization, database persistence, and audit history.

Admin assignment/configuration screens, seller order management, and customer tracking pages are outside this document's scope.

## 12. Security, privacy, accessibility, and reliability

Production requirements relevant to this app:
- Secure authentication/session handling and server-side authorization for every job read/status update.
- Enforce assignment ownership; client-side filtering alone is not sufficient.
- Limit personal information to what is necessary for delivery.
- Validate status transitions server-side and record relevant status changes/timestamps.
- Prevent partners from editing order/payment totals.
- Validate OTP/proof where configured.
- Use safe error messages; do not expose secrets or private data in frontend code/logs.
- Use persistent storage in production; browser storage is not the primary database.
- Mobile-first responsive design, accessible controls, readable status labels, visible focus states, clear validation/error messages, loading/empty states, and reduced-motion support.
- Do not expose private delivery routes to public search indexing.

## 13. Testing and acceptance criteria from the source

The following source acceptance requirements directly apply:
1. A partner can access only assigned deliveries.
2. Access to unassigned deliveries is denied, including when changing a URL/job ID.
3. Pickup/drop details are available for assigned jobs without exposing unnecessary personal data.
4. The partner can update status through the configured workflow.
5. OTP/proof works when configured and is not falsely shown as verified otherwise.
6. Failed-delivery reasons and reattempt workflow are represented correctly.
7. Delivery history is restricted to the current partner.
8. Earnings are shown only if enabled and use recorded data.
9. Partners cannot edit order totals or payment data.
10. Mobile navigation and delivery workflows work on small screens.
11. Routes load without 404s or broken navigation.
12. Invalid status transitions and failed requests produce clear errors without false success.

The master source also requires cross-platform tests for checkout, order splitting, payment verification, seller fulfilment, refunds, and notifications. These cannot be considered complete from the Delivery Partner App alone.

## 14. Source gaps requiring confirmation

The source does not fully specify:
- Exact profile fields and availability rules.
- Assignment accept/decline, reassignment, and cancellation rules.
- Whether OTP, photo, signature, or another proof method is enabled.
- Allowed failed-delivery reasons and reattempt limits.
- Partner earnings formula, payment schedule, and settlement workflow.
- Offline operation, live GPS tracking, route optimization, or background location.
- Notification channels and delivery guarantees.
- Exact status transition rules and who may override them.

Do not silently treat these as confirmed requirements.

## 15. Production scope versus frontend phase

The source expects a working marketplace with server-side authorization, persistent data, integration setup documentation, a test suite, and actual test results. If the current phase is frontend-only, use a separate development guide for mock data and simulated actions. Mock status changes, simulated OTP, and local job lists must not be represented as real production behavior.
