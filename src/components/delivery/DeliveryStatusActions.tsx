"use client";

import { useState } from "react";
import type { DeliveryJob, DeliveryStatus } from "@/types/delivery";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Toast } from "@/components/feedback/Toast";
import { FailureReasonForm } from "@/components/delivery/FailureReasonForm";
import { ReattemptPanel } from "@/components/delivery/ReattemptPanel";
import { useDeliverySession } from "@/context/delivery-session-context";
import { formatStatusLabel } from "@/lib/format";

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

export function DeliveryStatusActions({ job }: { job: DeliveryJob }) {
  const { updateStatus, failJob } = useDeliverySession();
  const [failureOpen, setFailureOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (job.status === "delivered" || job.status === "returned") {
    return <p className="text-sm text-app-muted">This delivery is complete. No further actions are available.</p>;
  }

  if (job.status === "failed") {
    return (
      <>
        <ReattemptPanel job={job} onActionSuccess={setToastMessage} />
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      </>
    );
  }

  if (job.status === "out_for_delivery") {
    return (
      <div className="flex flex-col gap-2">
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => {
              const result = updateStatus(job.id, "delivered");
              if (result.error) setError(result.error);
              else {
                setError(null);
                setToastMessage("Delivery marked delivered (simulated).");
              }
            }}
          >
            Mark delivered
          </Button>
          <Button variant="danger" onClick={() => setFailureOpen(true)}>
            Mark failed
          </Button>
        </div>
        <Dialog open={failureOpen} onClose={() => setFailureOpen(false)} title="Why did the delivery fail?">
          <FailureReasonForm
            onCancel={() => setFailureOpen(false)}
            onSubmit={(reason) => {
              const result = failJob(job.id, reason);
              if (result.error) {
                setError(result.error);
              } else {
                setError(null);
                setFailureOpen(false);
                setToastMessage("Delivery marked failed (simulated).");
              }
            }}
          />
        </Dialog>
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      </div>
    );
  }

  const nextStatus = FORWARD_NEXT[job.status];
  const label = FORWARD_LABEL[job.status];
  if (!nextStatus || !label) return null;

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button
        onClick={() => {
          const result = updateStatus(job.id, nextStatus);
          if (result.error) setError(result.error);
          else {
            setError(null);
            setToastMessage(`Status updated to "${formatStatusLabel(nextStatus)}" (simulated).`);
          }
        }}
      >
        {label}
      </Button>
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
