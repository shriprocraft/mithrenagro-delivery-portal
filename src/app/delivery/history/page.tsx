"use client";

import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryHistoryList } from "@/components/delivery/DeliveryHistoryList";
import { CardListSkeleton } from "@/components/feedback/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useDeliverySession } from "@/context/delivery-session-context";
import { useSimulatedLoading } from "@/lib/simulated-latency";

export default function DeliveryHistoryPage() {
  const { historyJobs, isBackendPartner, jobsLoading, jobsError, reloadJobs } = useDeliverySession();
  const simulatedLoading = useSimulatedLoading();
  const loading = isBackendPartner ? jobsLoading : simulatedLoading;

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Delivery history</h1>
      {loading ? (
        <CardListSkeleton label="Loading delivery history…" />
      ) : isBackendPartner && jobsError ? (
        <ErrorState message={`Your delivery history couldn't be loaded. ${jobsError}`} onRetry={reloadJobs} />
      ) : (
        <DeliveryHistoryList jobs={historyJobs} />
      )}
    </DeliveryAppShell>
  );
}
