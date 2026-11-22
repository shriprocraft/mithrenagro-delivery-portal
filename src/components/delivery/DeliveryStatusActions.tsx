"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type PendingAction = "forward" | "delivered" | "failed" | "release";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function DeliveryStatusActions({ job }: { job: DeliveryJob }) {
  const { updateStatus, failJob, releaseJob, showToast } = useDeliverySession();
  const router = useRouter();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState("");
  const [failureOpen, setFailureOpen] = useState(false);
  // Only one action runs at a time; every action button is disabled while it does.
  const [pending, setPending] = useState<PendingAction | null>(null);

  const backend = job.source === "backend";

  async function runAction(
    action: PendingAction,
    perform: () => MockActionResult | Promise<MockActionResult>,
    successMessage: string
  ) {
    if (pending) return;
    setPending(action);
    if (!backend) await simulateLatency();
    const result = await perform();
    setPending(null);
    if (result.error) {
      showToast(result.error, "error");
      return false;
    }
    showToast(successMessage);
    return true;
  }

  if (job.status === "delivered" || job.status === "returned" || job.status === "cancelled") {
    return (
      <p className="text-sm text-app-muted">
        {job.status === "cancelled"
          ? `This order was cancelled${job.cancel_reason ? `: ${job.cancel_reason}` : ""}. Don't collect or deliver it.`
          : "This delivery is complete."}{" "}
        No further actions are available.
      </p>
    );
  }

  // Registered partners' orders: the backend says what comes next
  // (assigned -> picked up, once the seller has packed it -> out for delivery -> delivered).
  if (backend) {
    const next = job.next_statuses ?? [];
    const cash = job.amount_to_collect ?? 0;
    if (next.includes("picked_up")) {
      return (
        <div className="flex flex-col gap-2">
          {!job.packed && (
            <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              Not packed yet. The seller is still packing this order; you can pick it up once it&apos;s marked packed.
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              loading={pending === "forward"}
              disabled={pending !== null}
              onClick={() => runAction("forward", () => updateStatus(job.id, "picked_up"), "Picked up. Head to the customer when you're ready.")}
            >
              Mark picked up
            </Button>
            <Button variant="ghost" disabled={pending !== null} onClick={() => setReleaseOpen(true)}>
              Can&apos;t pick it up
            </Button>
          </div>
          <Dialog open={releaseOpen} onClose={() => pending !== "release" && setReleaseOpen(false)} title="Give this pickup back?">
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (releaseReason.trim().length < 3 || pending) return;
                setPending("release");
                const error = await releaseJob(job.id, releaseReason.trim());
                setPending(null);
                if (error) return showToast(error, "error");
                setReleaseOpen(false);
                showToast("Pickup released. Another partner in your zone can take it.");
                router.push("/delivery/pickups");
              }}
            >
              <p className="text-sm text-app-muted">It goes back to the partners in this zone. Tell the team why.</p>
              <textarea
                className="min-h-20 rounded-md border border-app-border bg-surface p-2 text-sm"
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                placeholder="For example: bike puncture, can't reach the shop"
                maxLength={300}
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setReleaseOpen(false)} disabled={pending === "release"}>
                  Keep it
                </Button>
                <Button type="submit" variant="danger" loading={pending === "release"} disabled={releaseReason.trim().length < 3}>
                  Release pickup
                </Button>
              </div>
            </form>
          </Dialog>
        </div>
      );
    }
    if (next.includes("out_for_delivery")) {
      return (
        <Button
          className="self-start"
          loading={pending === "forward"}
          onClick={() => runAction("forward", () => updateStatus(job.id, "out_for_delivery"), "You're on the way to the customer.")}
        >
          Start delivery (in transit)
        </Button>
      );
    }
    if (next.includes("delivered")) {
      return (
        <div className="flex flex-col gap-2">
          {cash > 0 && <p className="text-sm font-medium text-app-text">Collect {rupees(cash)} in cash before marking it delivered.</p>}
          <Button
            className="self-start"
            loading={pending === "delivered"}
            onClick={() => runAction("delivered", () => updateStatus(job.id, "delivered"), "Delivery marked delivered.")}
          >
            Mark delivered
          </Button>
        </div>
      );
    }
    return null;
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
