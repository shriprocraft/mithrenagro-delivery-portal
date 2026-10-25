"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { PackageIcon, HistoryIcon, UserIcon } from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "/delivery/jobs", label: "Jobs", icon: PackageIcon },
  { href: "/delivery/history", label: "History", icon: HistoryIcon },
  { href: "/delivery/profile", label: "Profile", icon: UserIcon },
] as const;

export function DeliveryMobileNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Delivery partner navigation" className="sticky bottom-0 z-40 flex border-t border-app-border bg-surface">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              active ? "text-primary" : "text-app-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
