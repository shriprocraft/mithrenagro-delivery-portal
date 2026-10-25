// Demo-only sign-in accounts for the frontend prototype. These are fictional demo
// credentials chosen for testing — no email provider is contacted, the addresses are not
// verified as belonging to anyone, and the shared password is a public placeholder. This
// is NOT a security mechanism. Replace with the real partner authentication service when
// it exists; production auth must be server-side.
export const DEMO_PARTNER_PASSWORD = "demo123";

export const demoPartnerAccounts: { email: string; partner_id: string }[] = [
  { email: "arjunagro@gmail.com", partner_id: "partner-001" },
  { email: "divya.rajan@partners.mithrenagro.example", partner_id: "partner-002" },
];
