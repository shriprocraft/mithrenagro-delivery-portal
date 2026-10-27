"use client";

import { useState } from "react";
import { DeliveryAppShell } from "@/components/delivery/DeliveryAppShell";
import { DeliveryProfileForm } from "@/components/delivery/DeliveryProfileForm";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ProfileSkeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { useDeliverySession } from "@/context/delivery-session-context";
import { LogOutIcon } from "@/components/ui/icons";
import { simulateLatency, useSimulatedLoading } from "@/lib/simulated-latency";

export default function DeliveryProfilePage() {
  const { partner, signOut } = useDeliverySession();
  const loading = useSimulatedLoading();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await simulateLatency();
    signOut();
  }

  return (
    <DeliveryAppShell>
      <h1 className="mb-4 text-lg font-semibold text-app-text">Profile</h1>
      {loading ? (
        <ProfileSkeleton />
      ) : partner ? (
        <DeliveryProfileForm
          partner={partner}
          accountSection={
            <section
              aria-labelledby="account-heading"
              className="flex flex-col gap-3 rounded-lg border border-app-border bg-surface p-5 shadow-card"
            >
              <div>
                <h2 id="account-heading" className="text-sm font-semibold text-app-text">
                  Account
                </h2>
                <p className="text-xs text-app-muted">
                  You are signed in to a local demo session. Signing out returns you to the sign-in screen.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                loading={signingOut}
                className="self-start border border-danger/30 text-danger hover:bg-danger/5"
              >
                {!signingOut && <LogOutIcon className="h-4 w-4" />}
                {signingOut ? "Signing out…" : "Sign out of demo session"}
              </Button>
            </section>
          }
        />
      ) : (
        <EmptyState title="No active demo partner" description="Sign in again from the delivery entry screen." />
      )}
    </DeliveryAppShell>
  );
}
