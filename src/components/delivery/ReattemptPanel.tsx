"use client";

import { useState } from "react";
import type { DeliveryJob } from "@/types/delivery";
import { Button } from "@/components/ui/Button";
import { useDeliverySession } from "@/context/delivery-session-context";

export function ReattemptPanel({ job, onActionSuccess }: { job: DeliveryJob; onActionSuccess: (message: string) => void }) {
  const { reattemptJob, returnJob } = useDeliverySession();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-danger/30 bg-danger/5 p-4">
      <p className="text-sm font-medium text-app-text">
        Last failure reason: <span className="font-normal text-app-muted">{job.failed_reason ?? "Not recorded"}</span>
      </p>
      <p className="text-xs text-app-muted">
        Reattempts so far: {job.reattempt_count} (simulated — no maximum is enforced in this demo).
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => {
            const result = reattemptJob(job.id);
            if (result.error) setError(result.error);
            else {
              setError(null);
              onActionSuccess("Reattempt recorded (simulated). Delivery re-queued.");
            }
          }}
        >
          Reattempt delivery
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const result = returnJob(job.id);
            if (result.error) setError(result.error);
            else {
              setError(null);
              onActionSuccess("Delivery marked returned (simulated).");
            }
          }}
        >
          Mark returned
        </Button>
      </div>
    </div>
  );
}
