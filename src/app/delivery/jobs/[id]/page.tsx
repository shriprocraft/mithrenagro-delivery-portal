"use client";

import { useParams } from "next/navigation";
import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryJobDetails } from "@/components/delivery/DeliveryJobDetails";
import { EmptyState } from "@/components/feedback/EmptyState";
import { JobDetailsSkeleton } from "@/components/feedback/Skeleton";
import { useDeliverySession } from "@/context/delivery-session-context";
import { useSimulatedLoading } from "@/lib/simulated-latency";

export default function DeliveryJobDetailPage() {
  const params = useParams<{ id: string }>();
  const { getJob, isBackendPartner, jobsLoading } = useDeliverySession();
  const job = getJob(params.id);
  const simulatedLoading = useSimulatedLoading();
  const loading = isBackendPartner ? jobsLoading : simulatedLoading;

  return (
    <DeliveryAppShell>
      {loading ? (
        <JobDetailsSkeleton />
      ) : job ? (
        <DeliveryJobDetails job={job} />
      ) : (
        <EmptyState
          title="Delivery unavailable"
          description="This delivery isn't assigned to you, or the link is no longer valid."
        />
      )}
    </DeliveryAppShell>
  );
}
