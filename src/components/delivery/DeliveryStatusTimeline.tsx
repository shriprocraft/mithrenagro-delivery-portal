import type { DeliveryStatusEvent } from "@/types/delivery";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DeliveryStatusBadge } from "@/components/delivery/DeliveryStatusBadge";

// Beyond this many entries a horizontal row gets too cramped to read on desktop, so
// longer timelines (e.g. failed and reattempted jobs) stay vertical at every width.
const MAX_HORIZONTAL_EVENTS = 6;

export function DeliveryStatusTimeline({ events }: { events: DeliveryStatusEvent[] }) {
  const horizontal = events.length <= MAX_HORIZONTAL_EVENTS;

  return (
    <ol className={cn("flex flex-col", horizontal && "lg:grid lg:auto-cols-fr lg:grid-flow-col")}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <li
            key={`${event.status}-${event.at}-${index}`}
            className={cn("flex gap-3", horizontal && "lg:flex-col lg:gap-2")}
          >
            <div className={cn("flex flex-col items-center", horizontal && "lg:flex-row")}>
              <span
                className={cn("mt-[7px] h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary", horizontal && "lg:mt-0")}
              />
              {!isLast && (
                <span
                  className={cn("mt-1 w-px flex-1 bg-primary/25", horizontal && "lg:ml-1 lg:mt-0 lg:h-px lg:w-auto")}
                />
              )}
            </div>
            <div className={cn("min-w-0 pb-4", horizontal && "lg:pb-0 lg:pr-2")}>
              <DeliveryStatusBadge status={event.status} />
              <p className="mt-1 text-xs text-app-muted">{formatDateTime(event.at)}</p>
              {event.reason && <p className="text-xs text-danger">Reason: {event.reason}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
