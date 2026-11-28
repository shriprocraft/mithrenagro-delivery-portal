"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DeliveryHeader } from "@/components/delivery/DeliveryHeader";
import { DeliveryMobileNav } from "@/components/delivery/DeliveryMobileNav";
import { SiteFooter } from "@/components/delivery/SiteFooter";
import { Toast } from "@/components/feedback/Toast";
import { useDeliverySession } from "@/context/delivery-session-context";

export function DeliveryAppShell({ children }: { children: ReactNode }) {
  const { restoring, isSignedIn, mustChangePassword, toast, clearToast } = useDeliverySession();
  const router = useRouter();

  // Every signed-in delivery page renders inside this shell, so this one check keeps
  // signed-out visitors (including after sign-out) on the /delivery sign-in screen.
  // The backend enforces the same rules; this keeps the screens in step.
  // Waits until a stored session has been restored, so a page reload keeps the partner signed in.
  useEffect(() => {
    if (!restoring && !isSignedIn) router.replace("/delivery");
    // Until the password the Super Admin issued is replaced, only the set-new-password screen opens.
    else if (!restoring && mustChangePassword) router.replace("/delivery/set-password");
  }, [restoring, isSignedIn, mustChangePassword, router]);

  if (restoring || !isSignedIn || mustChangePassword) return null;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <DeliveryHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      <SiteFooter />
      <DeliveryMobileNav />
      <Toast toast={toast} onDismiss={clearToast} />
    </div>
  );
}
