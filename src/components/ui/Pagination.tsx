"use client";

import { cn } from "@/lib/cn";

const pageButtonClasses =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-pill px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel: string;
}) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label={`${itemLabel} pages`}
      className="flex flex-col items-center justify-between gap-2 border-t border-app-border pt-3 sm:flex-row"
    >
      <p className="text-xs text-app-muted">
        Showing {first}–{last} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(pageButtonClasses, "text-app-text hover:bg-app-border/40")}
        >
          Previous
        </button>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              pageButtonClasses,
              n === page ? "bg-primary text-white" : "text-app-text hover:bg-app-border/40"
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className={cn(pageButtonClasses, "text-app-text hover:bg-app-border/40")}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
