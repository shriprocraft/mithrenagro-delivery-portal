"use client";

import { useState } from "react";
import { useDeliverySession } from "@/context/delivery-session-context";
import { cn } from "@/lib/cn";
import { simulateLatency } from "@/lib/simulated-latency";

export function PartnerAvailabilityControl() {
  const { partner, toggleAvailability, showToast } = useDeliverySession();
  const [pending, setPending] = useState(false);
  if (!partner) return null;

  const available = partner.availability_status === "available";

  async function handleToggle() {
    if (pending) return;
    setPending(true);
    await simulateLatency();
    toggleAvailability();
    setPending(false);
    showToast(`You are now ${available ? "unavailable" : "available"} for new deliveries (simulated).`);
  }

  return (
    <section
      aria-labelledby="availability-heading"
      className="flex flex-col gap-4 rounded-lg border border-app-border bg-surface p-5 shadow-card"
    >
      <div>
        <h2 id="availability-heading" className="text-sm font-semibold text-app-text">
          Availability
        </h2>
        <p className="text-xs text-app-muted">Local demo value — not synced to a server.</p>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-md border p-4 transition-colors",
          available ? "border-primary/20 bg-primary-light" : "border-app-border bg-app-bg"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn("h-3 w-3 flex-shrink-0 rounded-full", available ? "bg-primary" : "bg-app-muted")}
          />
          <div className="min-w-0">
            <p className={cn("text-base font-semibold", available ? "text-primary-dark" : "text-app-text")}>
              {pending ? "Updating…" : available ? "Available" : "Unavailable"}
            </p>
            <p className="text-xs text-app-muted">
              {available ? "You can receive new deliveries." : "You won't receive new deliveries."}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          aria-label="Toggle availability"
          aria-busy={pending || undefined}
          disabled={pending}
          onClick={handleToggle}
          className={`relative h-8 w-14 flex-shrink-0 rounded-pill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
            available ? "bg-primary" : "bg-app-muted"
          }`}
        >
          <span
            className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              available ? "translate-x-7" : "translate-x-1"
            } ${pending ? "animate-pulse" : ""}`}
          />
        </button>
      </div>

      <p className="text-xs text-app-muted">Changing availability does not change your assigned jobs.</p>
    </section>
  );
}
