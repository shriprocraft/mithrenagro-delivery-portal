import { DEMO_PARTNER_PASSWORD, demoPartnerAccounts } from "@/data/demo-partner-accounts";

/**
 * Prototype sign-in check, kept separate from the delivery session so it can be swapped
 * for a real authentication service later. It only matches the demo fixtures in memory —
 * nothing is sent to a server and no identity is verified. Passwords are never stored.
 *
 * Returns the matching demo partner ID, or null when the email/password don't match.
 */
export function findDemoPartnerId(email: string, password: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  const account = demoPartnerAccounts.find((a) => a.email === normalizedEmail);
  if (!account || password !== DEMO_PARTNER_PASSWORD) return null;
  return account.partner_id;
}

// Returns the demo sign-in email linked to a partner, for display on the profile only.
export function getDemoAccountEmail(partnerId: string): string | undefined {
  return demoPartnerAccounts.find((a) => a.partner_id === partnerId)?.email;
}
