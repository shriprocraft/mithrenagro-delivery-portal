"use client";

import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryHistoryList } from "@/components/delivery/DeliveryHistoryList";
import { CardListSkeleton } from "@/components/feedback/Skeleton";
import { useDeliverySession } from "@/context/delivery-session-context";
import { useSimulatedLoading } from "@/lib/simulated-latency";

export default function DeliveryHistoryPage() {
  const { historyJobs } = useDeliverySession();
  const loading = useSimulatedLoading();

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Delivery history</h1>
      {loading ? (
        <CardListSkeleton label="Loading delivery history…" />
      ) : (
        <DeliveryHistoryList jobs={historyJobs} />
      )}
    </DeliveryAppShell>
  );
}
