import type { DeliveryStatus } from "@/types/delivery";

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  arrived_at_pickup: "Arrived at pickup",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  failed: "Failed",
  returned: "Returned",
};

export function formatStatusLabel(status: DeliveryStatus): string {
  return STATUS_LABELS[status];
}
