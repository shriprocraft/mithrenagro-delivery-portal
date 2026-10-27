"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import type { DeliveryJob } from "@/types/delivery";
import { DeliveryStatusBadge } from "@/components/delivery/DeliveryStatusBadge";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";

// Must render inside the <Link> — shows a spinner while the details route loads.
function CardChevron() {
  const { pending } = useLinkStatus();
  return pending ? (
    <Spinner className="h-5 w-5 flex-shrink-0 text-primary" />
  ) : (
    <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-app-muted" />
  );
}

// Shared clickable card shell for job and history entries — both open the job details page.
export function JobLinkCard({ job, children }: { job: DeliveryJob; children: ReactNode }) {
  return (
    <Link
      href={`/delivery/jobs/${job.id}`}
      aria-label={`View details for ${job.order_reference}`}
      className="flex h-full items-center justify-between gap-3 rounded-lg border border-app-border bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-app-text">{job.order_reference}</p>
          <DeliveryStatusBadge status={job.status} />
        </div>
        <p className="mt-1 truncate text-sm text-app-muted">{job.dropoff.address}</p>
        {children}
      </div>
      <CardChevron />
    </Link>
  );
}

export function DeliveryJobCard({ job }: { job: DeliveryJob }) {
  return (
    <JobLinkCard job={job}>
      {job.delivery_slot_label && <p className="mt-1 text-xs text-app-muted">{job.delivery_slot_label}</p>}
    </JobLinkCard>
  );
}
