"use client";

import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryJobList } from "@/components/delivery/DeliveryJobList";
import { useDeliverySession } from "@/context/delivery-session-context";

export default function DeliveryJobsPage() {
  const { assignedJobs } = useDeliverySession();

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Assigned deliveries</h1>
      <DeliveryJobList jobs={assignedJobs} />
    </DeliveryAppShell>
  );
}
