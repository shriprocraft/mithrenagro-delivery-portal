import type { DeliveryPartnerProfile } from "@/types/delivery";
import { PartnerAvailabilityControl } from "@/components/delivery/PartnerAvailabilityControl";

export function DeliveryProfileForm({ partner }: { partner: DeliveryPartnerProfile }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-app-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Name</p>
        <p className="mt-1 text-sm text-app-text">{partner.name}</p>
        {partner.phone && (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-app-muted">Phone</p>
            <p className="mt-1 text-sm text-app-text">{partner.phone}</p>
          </>
        )}
        {partner.vehicle_type && (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-app-muted">Vehicle</p>
            <p className="mt-1 text-sm text-app-text">{partner.vehicle_type}</p>
          </>
        )}
      </div>
      <PartnerAvailabilityControl />
    </div>
  );
}
