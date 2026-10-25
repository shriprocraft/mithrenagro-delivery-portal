"use client";

import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryProfileForm } from "@/components/delivery/DeliveryProfileForm";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/Button";
import { useDeliverySession } from "@/context/delivery-session-context";
import { LogOutIcon } from "@/components/ui/icons";

export default function DeliveryProfilePage() {
  const { partner, signOut } = useDeliverySession();

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Profile</h1>
      {partner ? (
        <div className="flex flex-col gap-4">
          <DeliveryProfileForm partner={partner} />
          <Button variant="ghost" onClick={signOut} className="self-start">
            <LogOutIcon className="h-4 w-4" />
            Sign out of demo session
          </Button>
        </div>
      ) : (
        <EmptyState title="No active demo partner" description="Sign in again from the delivery entry screen." />
      )}
    </DeliveryAppShell>
  );
}
