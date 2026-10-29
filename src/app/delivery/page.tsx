"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDeliverySession } from "@/context/delivery-session-context";
import { DemoModeNotice } from "@/components/delivery/DemoModeNotice";
import { DeliveryLoginForm } from "@/components/delivery/DeliveryLoginForm";
import { SiteFooter } from "@/components/delivery/SiteFooter";
import { Toast } from "@/components/feedback/Toast";
import logo from "../../../LOGO.png";

export default function DeliveryEntryPage() {
  const { isSignedIn, signIn, toast, clearToast } = useDeliverySession();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.replace("/delivery/jobs");
  }, [isSignedIn, router]);

  if (isSignedIn) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary-light to-app-bg">
      <DemoModeNotice />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-lg border border-app-border bg-surface p-6 shadow-raised sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            {/* Transparent, trimmed logo (black background removed) so it sits on the white card. */}
            <Image src={logo} alt="Mithren Agro Pvt. Ltd." priority sizes="224px" className="h-auto w-56" />
            <h1 className="mt-1 text-base font-semibold text-app-text">Delivery Partner Portal</h1>
          </div>
          <DeliveryLoginForm onSignIn={signIn} />
          <p className="mt-6 text-center text-xs text-app-muted">Authorized delivery partners only</p>
        </div>
      </main>
      <SiteFooter />
      <Toast toast={toast} onDismiss={clearToast} />
    </div>
  );
}
