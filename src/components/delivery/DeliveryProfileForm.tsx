import type { ReactNode } from "react";
import type { DeliveryPartnerProfile } from "@/types/delivery";
import { PartnerAvailabilityControl } from "@/components/delivery/PartnerAvailabilityControl";
import { Badge } from "@/components/ui/Badge";
import { MailIcon, PhoneIcon, TruckIcon, UserIcon } from "@/components/ui/icons";
import { getDemoAccountEmail } from "@/services/mock-auth";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-dark">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-app-text">{children}</dd>
      </div>
    </div>
  );
}

// Shows only fields that exist in the mock partner data — nothing invented to fill space.
// `accountSection` sits under Availability so both desktop columns balance without stretching.
export function DeliveryProfileForm({
  partner,
  accountSection,
}: {
  partner: DeliveryPartnerProfile;
  accountSection?: ReactNode;
}) {
  const available = partner.availability_status === "available";
  const email = getDemoAccountEmail(partner.id);

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Partner summary"
        className="flex items-center gap-4 rounded-lg border border-app-border bg-surface p-5 shadow-card"
      >
        <span
          aria-hidden="true"
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-white"
        >
          {getInitials(partner.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-app-text">{partner.name}</p>
          <p className="text-sm text-app-muted">Delivery partner · Mithren Agro</p>
          <div className="mt-2 sm:hidden">
            <Badge tone={available ? "success" : "neutral"}>{available ? "Available" : "Unavailable"}</Badge>
          </div>
        </div>
        <div className="hidden sm:block">
          <Badge tone={available ? "success" : "neutral"}>{available ? "Available" : "Unavailable"}</Badge>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <section
          aria-labelledby="partner-info-heading"
          className="rounded-lg border border-app-border bg-surface p-5 shadow-card"
        >
          <h2 id="partner-info-heading" className="mb-4 text-sm font-semibold text-app-text">
            Partner information
          </h2>
          <dl className="divide-y divide-app-border">
            {partner.phone && (
              <InfoRow icon={<PhoneIcon className="h-4 w-4" />} label="Phone">
                {partner.phone}
              </InfoRow>
            )}
            {email && (
              <InfoRow icon={<MailIcon className="h-4 w-4" />} label="Sign-in email">
                {email}
              </InfoRow>
            )}
            {partner.vehicle_type && (
              <InfoRow icon={<TruckIcon className="h-4 w-4" />} label="Vehicle">
                {partner.vehicle_type}
              </InfoRow>
            )}
            <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Partner ID">
              {partner.id}
            </InfoRow>
          </dl>
        </section>

        <div className="flex flex-col gap-4">
          <PartnerAvailabilityControl />
          {accountSection}
        </div>
      </div>
    </div>
  );
}
