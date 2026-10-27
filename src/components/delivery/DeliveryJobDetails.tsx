import Link from "next/link";
import type { DeliveryJob } from "@/types/delivery";
import { DeliveryStatusBadge } from "@/components/delivery/DeliveryStatusBadge";
import { DeliveryStatusActions } from "@/components/delivery/DeliveryStatusActions";
import { DeliveryStatusTimeline } from "@/components/delivery/DeliveryStatusTimeline";
import { PickupDropoffCard } from "@/components/delivery/PickupDropoffCard";
import { NavigationLink } from "@/components/delivery/NavigationLink";
import { formatDateTime } from "@/lib/format";

export function DeliveryJobDetails({ job }: { job: DeliveryJob }) {
  // Completed jobs are reached from History, so "back" returns there instead of Jobs.
  const isComplete = job.status === "delivered" || job.status === "returned";
  const backHref = isComplete ? "/delivery/history" : "/delivery/jobs";

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={backHref}
        className="self-start rounded-sm text-sm font-medium text-primary hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        ← Back to {isComplete ? "history" : "assigned deliveries"}
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-app-muted">Job reference</p>
          <p className="text-lg font-semibold text-app-text">{job.order_reference}</p>
          <p className="mt-1 text-xs text-app-muted">
            Assigned {formatDateTime(job.assigned_at)}
            {job.delivery_slot_label ? ` · Slot ${job.delivery_slot_label}` : ""}
          </p>
        </div>
        <DeliveryStatusBadge status={job.status} />
      </div>

      <section aria-labelledby="actions-heading" className="flex flex-col gap-2">
        <h2 id="actions-heading" className="text-sm font-semibold text-app-text">
          Available action
        </h2>
        <DeliveryStatusActions job={job} />
      </section>

      <section aria-labelledby="pickup-heading" className="flex flex-col gap-3">
        <h2 id="pickup-heading" className="sr-only">
          Pickup and drop-off
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PickupDropoffCard title="Pickup" contact={job.pickup} />
          <PickupDropoffCard title="Drop-off" contact={job.dropoff} />
        </div>
        <div>
          <NavigationLink address={job.dropoff.address} />
        </div>
      </section>

      {/* Full width under the order details, so the timeline reads as part of this order. */}
      <section
        aria-labelledby="timeline-heading"
        className="flex flex-col gap-3 rounded-lg border border-app-border bg-surface p-4"
      >
        <h2 id="timeline-heading" className="text-sm font-semibold text-app-text">
          Status history
        </h2>
        <DeliveryStatusTimeline events={job.status_history} />
      </section>
    </div>
  );
}
