"use client";

import Image from "next/image";
import { DeliveryRegistrationForm } from "@/components/delivery/DeliveryRegistrationForm";
import { SiteFooter } from "@/components/delivery/SiteFooter";
import logo from "../../../../LOGO.png";

// Same card, logo and background as the sign-in page (/delivery), a little wider for the form.
export default function DeliveryRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary-light to-app-bg">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-lg border border-app-border bg-surface p-6 shadow-raised sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Image src={logo} alt="Mithren Agro Pvt. Ltd." priority sizes="192px" className="h-auto w-48" />
            <h1 className="mt-1 text-base font-semibold text-app-text">Register as a Delivery Partner</h1>
            <p className="mt-1 text-sm text-app-muted">Three quick steps to start delivering with Mithren Agro.</p>
          </div>
          <DeliveryRegistrationForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
