"use client";

import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryHistoryList } from "@/components/delivery/DeliveryHistoryList";
import { useDeliverySession } from "@/context/delivery-session-context";

export default function DeliveryHistoryPage() {
  const { historyJobs } = useDeliverySession();

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Delivery history</h1>
      <DeliveryHistoryList jobs={historyJobs} />
    </DeliveryAppShell>
  );
}
