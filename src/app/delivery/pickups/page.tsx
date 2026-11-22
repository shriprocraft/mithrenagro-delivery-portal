"use client";

import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { AvailablePickups } from "@/components/delivery/AvailablePickups";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useDeliverySession } from "@/context/delivery-session-context";

export default function DeliveryPickupsPage() {
  const { isBackendPartner } = useDeliverySession();

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Available pickups</h1>
      {isBackendPartner ? (
        <AvailablePickups />
      ) : (
        <EmptyState
          title="Pickups are for registered partners"
          description="Demo partners see sample deliveries under Jobs. Sign in with your Mithren Agro partner account to see real pickups."
        />
      )}
    </DeliveryAppShell>
  );
}
