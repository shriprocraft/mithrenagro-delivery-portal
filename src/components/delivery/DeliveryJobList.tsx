"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeliveryJob, DeliveryStatus } from "@/types/delivery";
import { DeliveryJobCard } from "@/components/delivery/DeliveryJobCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { PackageIcon } from "@/components/ui/icons";
import { formatStatusLabel } from "@/lib/format";

const FILTERABLE_STATUSES: DeliveryStatus[] = [
  "assigned",
  "accepted",
  "arrived_at_pickup",
  "picked_up",
  "out_for_delivery",
  "failed",
];

export function DeliveryJobList({ jobs }: { jobs: DeliveryJob[] }) {
  // Brief simulated loading placeholder for where a real API call will eventually go.
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesSearch =
        search.trim().length === 0 || job.order_reference.toLowerCase().includes(search.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [jobs, search, statusFilter]);

  if (loading) return <LoadingState label="Loading assigned deliveries…" />;

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<PackageIcon className="h-8 w-8" />}
        title="No assigned deliveries"
        description="New jobs assigned to you will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by order reference"
          aria-label="Search assigned deliveries"
          className="flex-1 rounded-md border border-app-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as DeliveryStatus | "all")}
          aria-label="Filter by status"
          className="rounded-md border border-app-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="all">All statuses</option>
          {FILTERABLE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching deliveries" description="Try a different search or filter." />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((job) => (
            <li key={job.id}>
              <DeliveryJobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
