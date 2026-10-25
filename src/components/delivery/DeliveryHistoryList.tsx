import type { DeliveryJob } from "@/types/delivery";
import { DeliveryStatusBadge } from "@/components/delivery/DeliveryStatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { HistoryIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";

export function DeliveryHistoryList({ jobs }: { jobs: DeliveryJob[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<HistoryIcon className="h-8 w-8" />}
        title="No delivery history yet"
        description="Completed, failed-and-returned deliveries will appear here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {jobs.map((job) => {
        const lastEvent = job.status_history[job.status_history.length - 1];
        return (
          <li key={job.id} className="rounded-lg border border-app-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-app-text">{job.order_reference}</p>
              <DeliveryStatusBadge status={job.status} />
            </div>
            <p className="mt-1 text-sm text-app-muted">{job.dropoff.address}</p>
            <p className="mt-1 text-xs text-app-muted">
              {formatDate(lastEvent?.at ?? job.assigned_at)}
              {job.reattempt_count > 0 ? ` · ${job.reattempt_count} reattempt(s) (simulated)` : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
