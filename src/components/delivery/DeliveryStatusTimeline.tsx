import type { DeliveryStatusEvent } from "@/types/delivery";
import { formatDateTime } from "@/lib/format";
import { DeliveryStatusBadge } from "@/components/delivery/DeliveryStatusBadge";

export function DeliveryStatusTimeline({ events }: { events: DeliveryStatusEvent[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {events.map((event, index) => (
        <li key={`${event.status}-${event.at}-${index}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            {index < events.length - 1 && <span className="mt-1 w-px flex-1 bg-app-border" />}
          </div>
          <div className="pb-3">
            <DeliveryStatusBadge status={event.status} />
            <p className="mt-1 text-xs text-app-muted">{formatDateTime(event.at)}</p>
            {event.reason && <p className="text-xs text-danger">Reason: {event.reason}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
