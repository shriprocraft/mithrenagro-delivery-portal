"use client";

import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryJobList } from "@/components/delivery/DeliveryJobList";
import { CardListSkeleton } from "@/components/feedback/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useDeliverySession } from "@/context/delivery-session-context";
import { useSimulatedLoading } from "@/lib/simulated-latency";

export default function DeliveryJobsPage() {
  const { assignedJobs, isBackendPartner, jobsLoading, jobsError, reloadJobs } = useDeliverySession();
  // Registered partners: their orders from the backend. Demo partners: a brief simulated load.
  const simulatedLoading = useSimulatedLoading();
  const loading = isBackendPartner ? jobsLoading : simulatedLoading;

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Assigned deliveries</h1>
      {loading ? (
        <CardListSkeleton label="Loading assigned deliveries…" />
      ) : isBackendPartner && jobsError ? (
        <ErrorState message={`Your deliveries couldn't be loaded. ${jobsError}`} onRetry={reloadJobs} />
      ) : (
        <DeliveryJobList jobs={assignedJobs} />
      )}
    </DeliveryAppShell>
  );
}
