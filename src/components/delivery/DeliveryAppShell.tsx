"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DeliveryHeader } from "@/components/delivery/DeliveryHeader";
import { DeliveryMobileNav } from "@/components/delivery/DeliveryMobileNav";
import { DemoModeNotice } from "@/components/delivery/DemoModeNotice";
import { SiteFooter } from "@/components/delivery/SiteFooter";
import { Toast } from "@/components/feedback/Toast";
import { useDeliverySession } from "@/context/delivery-session-context";

export function DeliveryAppShell({ children }: { children: ReactNode }) {
  const { isSignedIn, notice, clearNotice } = useDeliverySession();
  const router = useRouter();

  // Every signed-in delivery page renders inside this shell, so this one check keeps
  // signed-out visitors (including after sign-out) on the /delivery sign-in screen.
  // Demo-only client guard; production authorization must be enforced server-side.
  useEffect(() => {
    if (!isSignedIn) router.replace("/delivery");
  }, [isSignedIn, router]);

  if (!isSignedIn) return null;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <DemoModeNotice />
      <DeliveryHeader />
      <main className="flex-1 px-4 py-4 sm:px-6">{children}</main>
      <SiteFooter />
      <DeliveryMobileNav />
      <Toast message={notice} onDismiss={clearNotice} tone="success" />
    </div>
  );
}
