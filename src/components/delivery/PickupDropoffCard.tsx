import { MapPinIcon, PhoneIcon } from "@/components/ui/icons";

interface ContactDetails {
  label?: string;
  address: string;
  contact_name?: string;
  contact_phone?: string;
}

export function PickupDropoffCard({ title, contact }: { title: string; contact: ContactDetails }) {
  return (
    <div className="rounded-lg border border-app-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{title}</p>
      {contact.label && <p className="mt-1 text-sm font-medium text-app-text">{contact.label}</p>}
      <div className="mt-2 flex items-start gap-2 text-sm text-app-text">
        <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-app-muted" />
        <span>{contact.address}</span>
      </div>
      {contact.contact_name && <p className="mt-2 text-sm text-app-muted">Contact: {contact.contact_name}</p>}
      {contact.contact_phone && (
        <a
          href={`tel:${contact.contact_phone}`}
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <PhoneIcon className="h-4 w-4" />
          {contact.contact_phone}
        </a>
      )}
    </div>
  );
}
