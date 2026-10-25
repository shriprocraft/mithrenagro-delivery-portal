"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDeliverySession } from "@/context/delivery-session-context";
import { DemoModeNotice } from "@/components/delivery/DemoModeNotice";
import { DeliveryLoginForm } from "@/components/delivery/DeliveryLoginForm";
import logo from "../../../LOGO.jpeg";

export default function DeliveryEntryPage() {
  const { isSignedIn, signIn } = useDeliverySession();
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
            {/* The logo file has wide white margins; object-cover trims them without altering the logo. */}
            <Image src={logo} alt="Mithren Agro Pvt. Ltd." priority sizes="224px" className="h-28 w-56 object-cover" />
            <h1 className="mt-1 text-base font-semibold text-app-text">Delivery Partner Portal</h1>
          </div>
          <DeliveryLoginForm onSignIn={signIn} />
          <p className="mt-6 text-center text-xs text-app-muted">Authorized delivery partners only</p>
        </div>
      </main>
    </div>
  );
}
