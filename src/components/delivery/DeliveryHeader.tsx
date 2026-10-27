"use client";

import Link from "next/link";
import { useDeliverySession } from "@/context/delivery-session-context";
import { Badge } from "@/components/ui/Badge";
import { UserIcon } from "@/components/ui/icons";

export function DeliveryHeader() {
  const { partner } = useDeliverySession();

  return (
    <header className="border-b border-app-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-app-text">Mithren Agro</p>
          <p className="text-xs text-app-muted">Delivery Partner Portal</p>
        </div>
        <div className="flex items-center gap-3">
          {partner && (
            <Badge tone={partner.availability_status === "available" ? "success" : "neutral"}>
              {partner.availability_status === "available" ? "Available" : "Unavailable"}
            </Badge>
          )}
          <Link
            href="/delivery/profile"
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-app-border/40 text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
