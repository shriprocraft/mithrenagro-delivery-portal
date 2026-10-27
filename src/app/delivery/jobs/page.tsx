"use client";

import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryJobList } from "@/components/delivery/DeliveryJobList";
import { CardListSkeleton } from "@/components/feedback/Skeleton";
import { useDeliverySession } from "@/context/delivery-session-context";
import { useSimulatedLoading } from "@/lib/simulated-latency";

export default function DeliveryJobsPage() {
  const { assignedJobs } = useDeliverySession();
  // Brief simulated loading placeholder for where a real API call will eventually go.
  const loading = useSimulatedLoading();

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Assigned deliveries</h1>
      {loading ? <CardListSkeleton label="Loading assigned deliveries…" /> : <DeliveryJobList jobs={assignedJobs} />}
    </DeliveryAppShell>
  );
}
