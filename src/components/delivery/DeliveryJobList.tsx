"use client";

import { useMemo, useState } from "react";
import type { DeliveryJob, DeliveryStatus } from "@/types/delivery";
import { DeliveryJobCard } from "@/components/delivery/DeliveryJobCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterSearch, FilterSelect, FilterSummary } from "@/components/ui/FilterControls";
import { Pagination } from "@/components/ui/Pagination";
import { PackageIcon } from "@/components/ui/icons";
import { formatStatusLabel } from "@/lib/format";
import {
  getPickupHubOptions,
  getSlotPeriod,
  matchesJobSearch,
  paginate,
  SLOT_PERIOD_LABELS,
  type SlotPeriod,
} from "@/lib/job-filters";

// Eight fills two columns × four rows — a full first page on desktop without crowding mobile.
const PAGE_SIZE = 8;

const FILTERABLE_STATUSES: DeliveryStatus[] = [
  "assigned",
  "accepted",
  "arrived_at_pickup",
  "picked_up",
  "out_for_delivery",
  "failed",
];

const STATUS_OPTIONS = [
  { value: "all" as const, label: "All statuses" },
  ...FILTERABLE_STATUSES.map((status) => ({ value: status, label: formatStatusLabel(status) })),
];

const SLOT_OPTIONS = [
  { value: "all" as const, label: "All delivery slots" },
  ...(Object.keys(SLOT_PERIOD_LABELS) as SlotPeriod[]).map((period) => ({
    value: period,
    label: SLOT_PERIOD_LABELS[period],
  })),
];

export function DeliveryJobList({ jobs }: { jobs: DeliveryJob[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const [hubFilter, setHubFilter] = useState("all");
  const [slotFilter, setSlotFilter] = useState<SlotPeriod | "all">("all");
  const [page, setPage] = useState(1);

  const hubOptions = useMemo(() => [{ value: "all", label: "All pickup hubs" }, ...getPickupHubOptions(jobs)], [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter(
      (job) =>
        (statusFilter === "all" || job.status === statusFilter) &&
        (hubFilter === "all" || job.pickup.label === hubFilter) &&
        (slotFilter === "all" || getSlotPeriod(job.delivery_slot_label) === slotFilter) &&
        matchesJobSearch(job, search)
    );
  }, [jobs, search, statusFilter, hubFilter, slotFilter]);

  const { pageItems, currentPage } = paginate(filtered, page, PAGE_SIZE);
  const filtersActive = search.trim() !== "" || statusFilter !== "all" || hubFilter !== "all" || slotFilter !== "all";

  // Any filter change returns to the first page so results are never hidden on a later page.
  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setHubFilter("all");
    setSlotFilter("all");
    setPage(1);
  }

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
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5 [&>select:last-child]:col-span-2 lg:[&>select:last-child]:col-span-1">
        <FilterSearch
          value={search}
          onChange={withPageReset(setSearch)}
          placeholder="Search e.g. ORD-48213, area or customer"
          label="Search assigned deliveries"
        />
        <FilterSelect value={statusFilter} onChange={withPageReset(setStatusFilter)} options={STATUS_OPTIONS} label="Filter by status" />
        <FilterSelect value={hubFilter} onChange={withPageReset(setHubFilter)} options={hubOptions} label="Filter by pickup hub" />
        <FilterSelect value={slotFilter} onChange={withPageReset(setSlotFilter)} options={SLOT_OPTIONS} label="Filter by delivery slot" />
      </div>

      <FilterSummary
        resultCount={filtered.length}
        itemLabel={filtered.length === 1 ? "delivery" : "deliveries"}
        active={filtersActive}
        onClear={clearFilters}
      />

      {filtered.length === 0 ? (
        <EmptyState title="No matching deliveries" description="Try a different search or filter." />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pageItems.map((job) => (
              <li key={job.id}>
                <DeliveryJobCard job={job} />
              </li>
            ))}
          </ul>
          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filtered.length}
            onPageChange={setPage}
            itemLabel="deliveries"
          />
        </>
      )}
    </div>
  );
}
