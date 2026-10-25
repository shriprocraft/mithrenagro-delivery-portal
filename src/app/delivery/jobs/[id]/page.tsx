"use client";

import { useParams } from "next/navigation";
import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryJobDetails } from "@/components/delivery/DeliveryJobDetails";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useDeliverySession } from "@/context/delivery-session-context";

export default function DeliveryJobDetailPage() {
  const params = useParams<{ id: string }>();
  const { getJob } = useDeliverySession();
  const job = getJob(params.id);

  return (
    <DeliveryAppShell>
      {job ? (
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
