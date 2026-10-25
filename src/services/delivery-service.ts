import type { DeliveryJob, DeliveryPartnerProfile, DeliveryStatus } from "@/types/delivery";
import { isValidTransition } from "@/lib/status-transitions";

const TERMINAL_STATUSES: DeliveryStatus[] = ["delivered", "returned"];

export interface MockActionResult {
  jobs: DeliveryJob[];
  job?: DeliveryJob;
  error?: string;
}

export function getCurrentDeliveryPartner(
  partners: DeliveryPartnerProfile[],
  partnerId: string
): DeliveryPartnerProfile | undefined {
  return partners.find((partner) => partner.id === partnerId);
}

// Active jobs include "failed" — a failed delivery still needs a partner decision
// (reattempt or return) before it is done, so it stays actionable rather than moving
// straight to history. See docs/ASSUMPTIONS.md.
export function getAssignedJobs(jobs: DeliveryJob[], partnerId: string): DeliveryJob[] {
  return jobs.filter(
    (job) => job.delivery_partner_id === partnerId && !TERMINAL_STATUSES.includes(job.status)
  );
}

// Ownership check happens here, not just in the UI: a job that exists but belongs to
// another partner returns undefined, identical to a job that doesn't exist at all — so
// the UI can never distinguish "not yours" from "doesn't exist".
export function getDeliveryJobById(
  jobs: DeliveryJob[],
  partnerId: string,
  jobId: string
): DeliveryJob | undefined {
  const job = jobs.find((candidate) => candidate.id === jobId);
  if (!job || job.delivery_partner_id !== partnerId) return undefined;
  return job;
}

function lastEventAt(job: DeliveryJob): string {
  return job.status_history[job.status_history.length - 1]?.at ?? job.assigned_at;
}

// History is derived from the same job records (filtered to terminal statuses) instead
// of a separate duplicated fixture, so a reattempted job can never appear twice.
export function getDeliveryHistory(jobs: DeliveryJob[], partnerId: string): DeliveryJob[] {
  return jobs
    .filter((job) => job.delivery_partner_id === partnerId && TERMINAL_STATUSES.includes(job.status))
    .sort((a, b) => lastEventAt(b).localeCompare(lastEventAt(a)));
}

export function updateMockDeliveryStatus(
  jobs: DeliveryJob[],
  partnerId: string,
  jobId: string,
  nextStatus: DeliveryStatus
): MockActionResult {
  const job = getDeliveryJobById(jobs, partnerId, jobId);
  if (!job) return { jobs, error: "This delivery is not available." };
  if (!isValidTransition(job.status, nextStatus)) {
    return { jobs, error: `Cannot move from "${job.status}" to "${nextStatus}".` };
  }

  const at = new Date().toISOString();
  const updatedJob: DeliveryJob = {
    ...job,
    status: nextStatus,
    status_history: [...job.status_history, { status: nextStatus, at }],
  };

  return { jobs: jobs.map((j) => (j.id === jobId ? updatedJob : j)), job: updatedJob };
}

export function recordMockFailure(
  jobs: DeliveryJob[],
  partnerId: string,
  jobId: string,
  reason: string
): MockActionResult {
  const job = getDeliveryJobById(jobs, partnerId, jobId);
  if (!job) return { jobs, error: "This delivery is not available." };
  if (!isValidTransition(job.status, "failed")) {
    return { jobs, error: `Cannot mark "${job.status}" as failed.` };
  }
  if (!reason.trim()) return { jobs, error: "A failure reason is required." };

  const at = new Date().toISOString();
  const updatedJob: DeliveryJob = {
    ...job,
    status: "failed",
    failed_reason: reason,
    status_history: [...job.status_history, { status: "failed", at, reason }],
  };

  return { jobs: jobs.map((j) => (j.id === jobId ? updatedJob : j)), job: updatedJob };
}

// Re-queues the same job for another delivery attempt — never creates a new job record,
// so it can never appear twice in the list or in history. No maximum is enforced; the
// count is shown and simply increments. Provisional demo behavior, see docs/ASSUMPTIONS.md.
export function recordMockReattempt(
  jobs: DeliveryJob[],
  partnerId: string,
  jobId: string
): MockActionResult {
  const job = getDeliveryJobById(jobs, partnerId, jobId);
  if (!job) return { jobs, error: "This delivery is not available." };
  if (job.status !== "failed") return { jobs, error: "Only a failed delivery can be reattempted." };

  const at = new Date().toISOString();
  const updatedJob: DeliveryJob = {
    ...job,
    status: "out_for_delivery",
    failed_reason: undefined,
    reattempt_count: job.reattempt_count + 1,
    status_history: [...job.status_history, { status: "out_for_delivery", at }],
  };

  return { jobs: jobs.map((j) => (j.id === jobId ? updatedJob : j)), job: updatedJob };
}

// Gives up on the delivery instead of reattempting — moves the same job straight to the
// terminal "returned" state, where it then appears once in history.
export function recordMockReturn(
  jobs: DeliveryJob[],
  partnerId: string,
  jobId: string
): MockActionResult {
  const job = getDeliveryJobById(jobs, partnerId, jobId);
  if (!job) return { jobs, error: "This delivery is not available." };
  if (job.status !== "failed") return { jobs, error: "Only a failed delivery can be marked returned." };

  const at = new Date().toISOString();
  const updatedJob: DeliveryJob = {
    ...job,
    status: "returned",
    failed_reason: undefined,
    status_history: [...job.status_history, { status: "returned", at }],
  };

  return { jobs: jobs.map((j) => (j.id === jobId ? updatedJob : j)), job: updatedJob };
}
