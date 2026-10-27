"use client";

import { useState } from "react";
import type { DeliveryJob, DeliveryStatus } from "@/types/delivery";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FailureReasonForm } from "@/components/delivery/FailureReasonForm";
import { ReattemptPanel } from "@/components/delivery/ReattemptPanel";
import { useDeliverySession } from "@/context/delivery-session-context";
import { formatStatusLabel } from "@/lib/format";
import { simulateLatency } from "@/lib/simulated-latency";
import type { MockActionResult } from "@/services/delivery-service";

const FORWARD_LABEL: Partial<Record<DeliveryStatus, string>> = {
  assigned: "Accept delivery",
  accepted: "Mark arrived at pickup",
  arrived_at_pickup: "Mark picked up",
  picked_up: "Start delivery",
};

const FORWARD_NEXT: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  assigned: "accepted",
  accepted: "arrived_at_pickup",
  arrived_at_pickup: "picked_up",
  picked_up: "out_for_delivery",
};

type PendingAction = "forward" | "delivered" | "failed";

export function DeliveryStatusActions({ job }: { job: DeliveryJob }) {
  const { updateStatus, failJob, showToast } = useDeliverySession();
  const [failureOpen, setFailureOpen] = useState(false);
  // Only one action runs at a time; every action button is disabled while it does.
  const [pending, setPending] = useState<PendingAction | null>(null);

  async function runAction(action: PendingAction, perform: () => MockActionResult, successMessage: string) {
    if (pending) return;
    setPending(action);
    await simulateLatency();
    const result = perform();
    setPending(null);
    if (result.error) {
      showToast(result.error, "error");
      return false;
    }
    showToast(successMessage);
    return true;
  }

  if (job.status === "delivered" || job.status === "returned") {
    return <p className="text-sm text-app-muted">This delivery is complete. No further actions are available.</p>;
  }

  if (job.status === "failed") {
    return <ReattemptPanel job={job} />;
  }

  if (job.status === "out_for_delivery") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            loading={pending === "delivered"}
            disabled={pending !== null}
            onClick={() =>
              runAction("delivered", () => updateStatus(job.id, "delivered"), "Delivery marked delivered (simulated).")
            }
          >
            Mark delivered
          </Button>
          <Button variant="danger" disabled={pending !== null} onClick={() => setFailureOpen(true)}>
            Mark failed
          </Button>
        </div>
        <Dialog
          open={failureOpen}
          onClose={() => {
            if (pending !== "failed") setFailureOpen(false);
          }}
          title="Why did the delivery fail?"
        >
          <FailureReasonForm
            submitting={pending === "failed"}
            onCancel={() => setFailureOpen(false)}
            onSubmit={async (reason) => {
              const ok = await runAction("failed", () => failJob(job.id, reason), "Delivery marked failed (simulated).");
              if (ok) setFailureOpen(false);
            }}
          />
        </Dialog>
      </div>
    );
  }

  const nextStatus = FORWARD_NEXT[job.status];
  const label = FORWARD_LABEL[job.status];
  if (!nextStatus || !label) return null;

  return (
    <Button
      className="self-start"
      loading={pending === "forward"}
      onClick={() =>
        runAction(
          "forward",
          () => updateStatus(job.id, nextStatus),
          `Status updated to "${formatStatusLabel(nextStatus)}" (simulated).`
        )
      }
    >
      {label}
    </Button>
  );
}
