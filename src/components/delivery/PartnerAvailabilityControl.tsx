"use client";

import { useDeliverySession } from "@/context/delivery-session-context";

export function PartnerAvailabilityControl() {
  const { partner, toggleAvailability } = useDeliverySession();
  if (!partner) return null;

  const available = partner.availability_status === "available";

  return (
    <div className="rounded-lg border border-app-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-app-text">Availability</p>
          <p className="text-xs text-app-muted">Local demo value — not synced to a server.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          aria-label="Toggle availability"
          onClick={toggleAvailability}
          className={`relative h-7 w-12 rounded-pill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            available ? "bg-primary" : "bg-app-muted"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              available ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <p className="mt-2 text-sm text-app-text">
        You are currently <strong>{available ? "available" : "unavailable"}</strong> for new deliveries. This does
        not change your assigned jobs.
      </p>
    </div>
  );
}
