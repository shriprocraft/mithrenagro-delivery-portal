import { MapPinIcon } from "@/components/ui/icons";

// Opens the address in an external maps search — a navigation destination only, never
// live GPS tracking or route optimization, per ORGANIC_MARKETPLACE_DELIVERY_APP_SCOPE.md.
function buildMapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function NavigationLink({ address }: { address?: string }) {
  if (!address) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-pill border border-app-border px-4 py-2 text-sm text-app-muted"
      >
        <MapPinIcon className="h-4 w-4" />
        Navigation unavailable
      </button>
    );
  }

  return (
    <a
      href={buildMapsSearchUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-pill bg-primary-light px-4 py-2 text-sm font-medium text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <MapPinIcon className="h-4 w-4" />
      Open in Maps
    </a>
  );
}
