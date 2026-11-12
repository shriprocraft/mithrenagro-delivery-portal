"use client";

import { useDeliverySession } from "@/context/delivery-session-context";

// Shown on the sign-in screen and to demo partners; registered partners see real data.
export function DemoModeNotice() {
  const { isBackendPartner } = useDeliverySession();
  if (isBackendPartner) return null;
  return (
    <div className="bg-primary-light px-4 py-2 text-center text-xs font-medium text-primary-dark">
      Demo mode — data is simulated. No real deliveries, payments, or notifications are sent.
    </div>
  );
}
