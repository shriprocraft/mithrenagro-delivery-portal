# Mithren Agro — Delivery Partner Portal (Frontend Demo)

Frontend-only demo of the Delivery Partner Portal described in:

- `ORGANIC_MARKETPLACE_DELIVERY_APP_SCOPE.md` — source of truth for business scope
- `DELIVERY_APP_FRONTEND_DEVELOPMENT_GUIDE.md` — source of truth for the frontend
  implementation approach

All data is mock/local React state. There is no backend, database, real
authentication, live GPS, real OTP/proof, real notifications, or real payment
processing in this phase. See `docs/ASSUMPTIONS.md` for demo-only decisions and open
business questions that were intentionally left unresolved rather than invented.

## Getting started

```bash
npm install
npm run dev
```

Then open <http://127.0.0.1:3000/delivery>. The dev server always uses port 3000 on
127.0.0.1 (`next dev -H 127.0.0.1 -p 3000`).

## Backend

The portal talks to the shared Mithren Agro FastAPI backend (`mithren-agro-backend`), on
<http://127.0.0.1:8000> by default:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

All requests go through `src/config/api.ts` (`apiUrl()` / `apiFetch()`). The backend has
no delivery-partner endpoints yet, so the screens still use demo data; `DELIVERY_API` in
that file lists the endpoints each screen needs.

The demo signs you in as a fixed mock partner ("Arjun Kumar", `partner-001`). A second
fictional partner (`partner-002`) exists only in the fixtures to prove job/history
isolation in the service layer — there is no UI to switch to them.

## Checks

```bash
npm run lint
npm run build
```

These have not been run in this environment — this machine has no Node.js/npm
installed. Run them locally with Node 18+ and report any errors back for fixes.

## Reference

The visual theme reference image lives at `references/ui-theme.png`. Design tokens
derived from it (approximations, not confirmed brand values) are in
`src/config/design-tokens.ts`.
