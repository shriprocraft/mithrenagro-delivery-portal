import type { DeliveryJob } from "@/types/delivery";

// Client-side list filtering for the demo. With a real API these would become query params.

export function matchesJobSearch(job: DeliveryJob, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [job.order_reference, job.dropoff.address, job.dropoff.contact_name ?? ""].some((field) =>
    field.toLowerCase().includes(q)
  );
}

export function formatHubLabel(label: string): string {
  return label.replace(/^Mithren Agro\s*—\s*/, "");
}

export function getPickupHubOptions(jobs: DeliveryJob[]): { value: string; label: string }[] {
  const labels = Array.from(new Set(jobs.map((job) => job.pickup.label))).sort();
  return labels.map((label) => ({ value: label, label: formatHubLabel(label) }));
}

export type SlotPeriod = "morning" | "afternoon" | "evening";

export const SLOT_PERIOD_LABELS: Record<SlotPeriod, string> = {
  morning: "Morning (before 12 PM)",
  afternoon: "Afternoon (12–4 PM)",
  evening: "Evening (after 4 PM)",
};

// Reads the start time from a slot label such as "9:00 AM – 11:00 AM".
export function getSlotPeriod(slotLabel?: string): SlotPeriod | undefined {
  const match = slotLabel?.match(/^(\d{1,2}):\d{2}\s*(AM|PM)/i);
  if (!match) return undefined;
  const hour12 = Number(match[1]) % 12;
  const hour = match[2].toUpperCase() === "PM" ? hour12 + 12 : hour12;
  if (hour < 12) return "morning";
  if (hour < 16) return "afternoon";
  return "evening";
}

export function paginate<T>(items: T[], page: number, pageSize: number): { pageItems: T[]; currentPage: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  // Clamp, so a page that empties out (e.g. a job moving to history) falls back gracefully.
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  return { pageItems: items.slice((currentPage - 1) * pageSize, currentPage * pageSize), currentPage };
}
