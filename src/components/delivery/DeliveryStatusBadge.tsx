import type { DeliveryStatus } from "@/types/delivery";
import { Badge } from "@/components/ui/Badge";
import { formatStatusLabel } from "@/lib/format";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  PackageIcon,
  UndoIcon,
} from "@/components/ui/icons";

const STATUS_TONE: Record<DeliveryStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  assigned: "neutral",
  accepted: "info",
  arrived_at_pickup: "info",
  picked_up: "info",
  out_for_delivery: "warning",
  delivered: "success",
  failed: "danger",
  returned: "neutral",
};

const STATUS_ICON: Record<DeliveryStatus, typeof ClockIcon> = {
  assigned: ClockIcon,
  accepted: CheckCircleIcon,
  arrived_at_pickup: PackageIcon,
  picked_up: PackageIcon,
  out_for_delivery: TruckIcon,
  delivered: CheckCircleIcon,
  failed: XCircleIcon,
  returned: UndoIcon,
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <Badge tone={STATUS_TONE[status]} icon={<Icon className="h-3.5 w-3.5" />}>
      {formatStatusLabel(status)}
    </Badge>
  );
}
