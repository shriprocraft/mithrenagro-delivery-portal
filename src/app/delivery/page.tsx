"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeliverySession } from "@/context/delivery-session-context";
import { DeliveryLoginForm } from "@/components/delivery/DeliveryLoginForm";
import { SiteFooter } from "@/components/delivery/SiteFooter";
import { Toast } from "@/components/feedback/Toast";
import { takeSignInNotice } from "@/services/delivery-api";
import logo from "../../../LOGO.png";

// useSearchParams needs a Suspense boundary when the page is pre-rendered.
export default function DeliveryEntryPage() {
  return (
    <Suspense fallback={null}>
      <DeliveryEntry />
    </Suspense>
  );
}

function DeliveryEntry() {
  const { restoring, isSignedIn, mustChangePassword, toast, clearToast } = useDeliverySession();
  const router = useRouter();
  const search = useSearchParams();
  // A message left for this screen: the account was suspended, or a password was just reset.
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const left = takeSignInNotice();
    if (left) setNotice({ tone: "error", text: left });
    else if (search.get("reset") === "1") setNotice({ tone: "success", text: "Your password has been reset. Sign in with your new password." });
  }, [search]);

  useEffect(() => {
    // A password the Super Admin issued must be replaced before anything else.
    if (isSignedIn) router.replace(mustChangePassword ? "/delivery/set-password" : "/delivery/pickups");
  }, [isSignedIn, mustChangePassword, router]);

  // While a stored session is restored (or once signed in), the page redirects to the jobs list.
  if (restoring || isSignedIn) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary-light to-app-bg">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-lg border border-app-border bg-surface p-6 shadow-raised sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            {/* Transparent, trimmed logo (black background removed) so it sits on the white card. */}
            <Image src={logo} alt="Mithren Agro Pvt. Ltd." priority sizes="224px" className="h-auto w-56" />
            <h1 className="mt-1 text-base font-semibold text-app-text">Delivery Partner Portal</h1>
          </div>
          {notice && (
            <p
              role={notice.tone === "error" ? "alert" : "status"}
              className={
                notice.tone === "error"
                  ? "mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
                  : "mb-4 rounded-md border border-primary/30 bg-primary-light px-3 py-2 text-sm text-primary-dark"
              }
            >
              {notice.text}
            </p>
          )}
          <DeliveryLoginForm />
          <p className="mt-5 text-center text-sm text-app-muted">
            Delivery partner accounts are created by Mithren Agro. Contact your operations manager for your sign-in
            details.
          </p>
          <p className="mt-3 text-center text-xs text-app-muted">Authorized delivery partners only</p>
        </div>
      </main>
      <SiteFooter />
      <Toast toast={toast} onDismiss={clearToast} />
    </div>
  );
}
