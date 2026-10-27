"use client";

import { useState } from "react";
import type { DeliveryJob } from "@/types/delivery";
import { Button } from "@/components/ui/Button";
import { useDeliverySession } from "@/context/delivery-session-context";
import { simulateLatency } from "@/lib/simulated-latency";
import type { MockActionResult } from "@/services/delivery-service";

export function ReattemptPanel({ job }: { job: DeliveryJob }) {
  const { reattemptJob, returnJob, showToast } = useDeliverySession();
  const [pending, setPending] = useState<"reattempt" | "return" | null>(null);

  async function runAction(action: "reattempt" | "return", perform: () => MockActionResult, successMessage: string) {
    if (pending) return;
    setPending(action);
    await simulateLatency();
    const result = perform();
    setPending(null);
    if (result.error) showToast(result.error, "error");
    else showToast(successMessage);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-danger/30 bg-danger/5 p-4">
      <p className="text-sm font-medium text-app-text">
        Last failure reason: <span className="font-normal text-app-muted">{job.failed_reason ?? "Not recorded"}</span>
      </p>
      <p className="text-xs text-app-muted">
        Reattempts so far: {job.reattempt_count} (simulated — no maximum is enforced in this demo).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          loading={pending === "reattempt"}
          disabled={pending !== null}
          onClick={() =>
            runAction("reattempt", () => reattemptJob(job.id), "Reattempt recorded (simulated). Delivery re-queued.")
          }
        >
          Reattempt delivery
        </Button>
        <Button
          variant="secondary"
          loading={pending === "return"}
          disabled={pending !== null}
          onClick={() => runAction("return", () => returnJob(job.id), "Delivery marked returned (simulated).")}
        >
          Mark returned
        </Button>
      </div>
    </div>
  );
}
