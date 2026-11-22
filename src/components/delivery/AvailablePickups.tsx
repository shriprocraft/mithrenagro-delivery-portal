"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PickupBoard, PickupOffer } from "@/types/delivery";
import { ApiRequestError } from "@/config/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { CardListSkeleton } from "@/components/feedback/Skeleton";
import { MapPinIcon, PackageIcon } from "@/components/ui/icons";
import { useDeliverySession } from "@/context/delivery-session-context";
import { deliveryApi, SessionExpiredError } from "@/services/delivery-api";
import { formatDateTime } from "@/lib/format";

// How often the list is checked for new pickups while the screen is open and visible.
const POLL_MS = 5_000;
const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

type Blocked = { kind: "unavailable" | "not_approved" | "error"; message: string };

/**
 * Approved orders from shops in the partner's zones that no partner has accepted yet. The first partner
 * to tap "OK, I will pick up" gets the order; it then disappears from everyone else's list.
 */
export function AvailablePickups() {
  const { acceptPickup, showToast, signOut } = useDeliverySession();
  const router = useRouter();
  const [board, setBoard] = useState<PickupBoard | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await deliveryApi.pickups();
      // A pickup that wasn't there on the last check: tell the partner.
      if (known.current) {
        const fresh = next.offers.filter((o) => !known.current!.has(o.orderId));
        if (fresh.length) showToast(fresh.length === 1 ? `New pickup: ${fresh[0].orderNumber} at ${fresh[0].shopName}` : `${fresh.length} new pickups`, "success");
      }
      known.current = new Set(next.offers.map((o) => o.orderId));
      setBoard(next);
      setBlocked(null);
    } catch (error) {
      if (error instanceof SessionExpiredError) return signOut();
      if (error instanceof ApiRequestError && error.status === 409) setBlocked({ kind: "unavailable", message: error.message });
      else if (error instanceof ApiRequestError && error.status === 403) setBlocked({ kind: "not_approved", message: error.message });
      else setBlocked({ kind: "error", message: error instanceof Error ? error.message : "Pickups couldn't be loaded." });
    }
  }, [showToast, signOut]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  async function accept(offer: PickupOffer) {
    if (accepting) return;
    setAccepting(offer.orderId);
    const result = await acceptPickup(offer.orderId);
    setAccepting(null);
    if (result.error) {
      showToast(result.taken ? `${offer.orderNumber}: ${result.error}` : result.error, "error");
      // Taken by someone else (or no longer waiting): it leaves the list.
      setBoard((b) => (b ? { ...b, offers: b.offers.filter((o) => o.orderId !== offer.orderId) } : b));
      void load();
      return;
    }
    showToast(`${offer.orderNumber} is yours. Collect it from ${offer.shopName}.`);
    router.push(`/delivery/jobs/${offer.orderId}`);
  }

  if (blocked) {
    return (
      <EmptyState
        icon={<PackageIcon className="h-8 w-8" />}
        title={blocked.kind === "unavailable" ? "You're unavailable" : blocked.kind === "not_approved" ? "Waiting for approval" : "Pickups couldn't be loaded"}
        description={blocked.message}
        action={
          blocked.kind === "unavailable" ? (
            <Link href="/delivery/profile" className="text-sm font-medium text-primary hover:underline">
              Go to Profile to become available
            </Link>
          ) : blocked.kind === "error" ? (
            <Button variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          ) : undefined
        }
      />
    );
  }
  if (!board) return <CardListSkeleton label="Looking for pickups near you…" />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-app-muted">
        {board.pincodes.length
          ? `Pickups from shops in ${board.pincodes.join(", ")}. This list updates every few seconds.`
          : "No delivery zone is assigned to you yet."}
        {board.maxActiveJobs ? ` You have ${board.activeJobs} of ${board.maxActiveJobs} deliveries in progress.` : ""}
      </p>
      {board.offers.length === 0 ? (
        <EmptyState
          icon={<PackageIcon className="h-8 w-8" />}
          title={board.pincodes.length ? "No pickups right now" : "No delivery zone yet"}
          description={
            board.pincodes.length
              ? "New orders appear here as soon as a seller approves them. Keep this screen open."
              : "Mithren Agro assigns your pincode zone. Contact your operations manager."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {board.offers.map((offer) => (
            <li key={offer.orderId} className="flex flex-col gap-3 rounded-lg border border-app-border bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-app-text">{offer.orderNumber}</p>
                  <p className="truncate text-sm text-app-text">{offer.shopName}</p>
                </div>
                {offer.packed ? <Badge tone="success">Packed · ready</Badge> : <Badge tone="warning">Seller is packing</Badge>}
              </div>
              <div className="flex flex-col gap-1 text-sm text-app-muted">
                <p className="flex items-start gap-1.5">
                  <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    Pickup: {offer.pickupAddress}
                    {offer.pickupPincode ? ` · ${offer.pickupPincode}` : ""}
                  </span>
                </p>
                <p className="pl-5">Drop-off area: {offer.dropoffArea}</p>
                <p className="pl-5">
                  {offer.itemCount} item{offer.itemCount === 1 ? "" : "s"} · {rupees(offer.total)}
                  {offer.amountToCollect > 0 ? ` · Collect ${rupees(offer.amountToCollect)} cash` : " · Paid online"}
                </p>
                {offer.approvedAt && <p className="pl-5 text-xs">Approved {formatDateTime(offer.approvedAt)}</p>}
              </div>
              <Button loading={accepting === offer.orderId} disabled={accepting !== null} onClick={() => void accept(offer)}>
                OK, I will pick up
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
