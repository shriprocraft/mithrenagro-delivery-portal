import Link from "next/link";
import type { DeliveryJob } from "@/types/delivery";
import { DeliveryStatusBadge } from "@/components/delivery/DeliveryStatusBadge";
import { ChevronRightIcon } from "@/components/ui/icons";

export function DeliveryJobCard({ job }: { job: DeliveryJob }) {
  return (
    <Link
      href={`/delivery/jobs/${job.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-app-border bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-app-text">{job.order_reference}</p>
          <DeliveryStatusBadge status={job.status} />
        </div>
        <p className="mt-1 truncate text-sm text-app-muted">{job.dropoff.address}</p>
        {job.delivery_slot_label && <p className="mt-1 text-xs text-app-muted">{job.delivery_slot_label}</p>}
      </div>
      <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-app-muted" />
    </Link>
  );
}
