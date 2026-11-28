import Image from "next/image";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/delivery/SiteFooter";
import logo from "../../../LOGO.png";

/** The centred card used by the sign-in, set-new-password and forgot-password screens. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary-light to-app-bg">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-lg border border-app-border bg-surface p-6 shadow-raised sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Image src={logo} alt="Mithren Agro Pvt. Ltd." priority sizes="224px" className="h-auto w-56" />
            <h1 className="mt-1 text-base font-semibold text-app-text">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-app-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
