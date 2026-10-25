import type { DeliveryJob } from "@/types/delivery";
import { DeliveryStatusBadge } from "@/components/delivery/DeliveryStatusBadge";
import { DeliveryStatusActions } from "@/components/delivery/DeliveryStatusActions";
import { DeliveryStatusTimeline } from "@/components/delivery/DeliveryStatusTimeline";
import { PickupDropoffCard } from "@/components/delivery/PickupDropoffCard";
import { NavigationLink } from "@/components/delivery/NavigationLink";
import { formatDateTime } from "@/lib/format";

export function DeliveryJobDetails({ job }: { job: DeliveryJob }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-app-muted">Job reference</p>
          <p className="text-lg font-semibold text-app-text">{job.order_reference}</p>
          <p className="mt-1 text-xs text-app-muted">Assigned {formatDateTime(job.assigned_at)}</p>
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
        <PickupDropoffCard title="Pickup" contact={job.pickup} />
        <PickupDropoffCard title="Drop-off" contact={job.dropoff} />
        <NavigationLink address={job.dropoff.address} />
      </section>

      <section aria-labelledby="timeline-heading" className="flex flex-col gap-3">
        <h2 id="timeline-heading" className="text-sm font-semibold text-app-text">
          Status history
        </h2>
        <DeliveryStatusTimeline events={job.status_history} />
      </section>
    </div>
  );
}
