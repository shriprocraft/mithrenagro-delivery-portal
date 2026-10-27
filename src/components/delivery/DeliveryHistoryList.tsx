"use client";

import { useMemo, useState } from "react";
import type { DeliveryJob } from "@/types/delivery";
import { JobLinkCard } from "@/components/delivery/DeliveryJobCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterSearch, FilterSelect, FilterSummary } from "@/components/ui/FilterControls";
import { Pagination } from "@/components/ui/Pagination";
import { HistoryIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import { getPickupHubOptions, matchesJobSearch, paginate } from "@/lib/job-filters";
import { lastEventAt } from "@/services/delivery-service";

const PAGE_SIZE = 8;

type OutcomeFilter = "all" | "delivered" | "returned";
type SortOrder = "newest" | "oldest";

const OUTCOME_OPTIONS: { value: OutcomeFilter; label: string }[] = [
  { value: "all", label: "All outcomes" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

export function DeliveryHistoryList({ jobs }: { jobs: DeliveryJob[] }) {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");
  const [hubFilter, setHubFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);

  const hubOptions = useMemo(() => [{ value: "all", label: "All pickup hubs" }, ...getPickupHubOptions(jobs)], [jobs]);

  // `jobs` arrives newest-first from getDeliveryHistory, so "oldest" just reverses it.
  const filtered = useMemo(() => {
    const matches = jobs.filter(
      (job) =>
        (outcomeFilter === "all" || job.status === outcomeFilter) &&
        (hubFilter === "all" || job.pickup.label === hubFilter) &&
        matchesJobSearch(job, search)
    );
    return sortOrder === "oldest" ? matches.reverse() : matches;
  }, [jobs, search, outcomeFilter, hubFilter, sortOrder]);

  const { pageItems, currentPage } = paginate(filtered, page, PAGE_SIZE);
  const filtersActive = search.trim() !== "" || outcomeFilter !== "all" || hubFilter !== "all";

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setOutcomeFilter("all");
    setHubFilter("all");
    setPage(1);
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<HistoryIcon className="h-8 w-8" />}
        title="No delivery history yet"
        description="Completed, failed-and-returned deliveries will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5 [&>select:last-child]:col-span-2 lg:[&>select:last-child]:col-span-1">
        <FilterSearch
          value={search}
          onChange={withPageReset(setSearch)}
          placeholder="Search e.g. ORD-48050, area or customer"
          label="Search delivery history"
        />
        <FilterSelect value={outcomeFilter} onChange={withPageReset(setOutcomeFilter)} options={OUTCOME_OPTIONS} label="Filter by outcome" />
        <FilterSelect value={hubFilter} onChange={withPageReset(setHubFilter)} options={hubOptions} label="Filter by pickup hub" />
        <FilterSelect value={sortOrder} onChange={withPageReset(setSortOrder)} options={SORT_OPTIONS} label="Sort by completion date" />
      </div>

      <FilterSummary
        resultCount={filtered.length}
        itemLabel={filtered.length === 1 ? "delivery" : "deliveries"}
        active={filtersActive}
        onClear={clearFilters}
      />

      {filtered.length === 0 ? (
        <EmptyState title="No matching history" description="Try a different search or filter." />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pageItems.map((job) => (
              <li key={job.id}>
                <JobLinkCard job={job}>
                  <p className="mt-1 text-xs text-app-muted">
                    {formatDate(lastEventAt(job))}
                    {job.reattempt_count > 0 ? ` · ${job.reattempt_count} reattempt(s) (simulated)` : ""}
                  </p>
                </JobLinkCard>
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
