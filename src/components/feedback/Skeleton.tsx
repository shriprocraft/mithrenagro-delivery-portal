import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-md bg-app-border", className)} />;
}

function SkeletonStatus({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function CardListSkeleton({ label, count = 8 }: { label: string; count?: number }) {
  return (
    <SkeletonStatus label={label}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className={cn("h-10", i === 0 && "col-span-2", i === 3 && "col-span-2 lg:col-span-1")} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="rounded-lg border border-app-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-pill" />
              </div>
              <Skeleton className="mt-3 h-3.5 w-11/12" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonStatus>
  );
}

export function JobDetailsSkeleton() {
  return (
    <SkeletonStatus label="Loading delivery details…">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-10 w-40 rounded-pill" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </SkeletonStatus>
  );
}

export function ProfileSkeleton() {
  return (
    <SkeletonStatus label="Loading profile…">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full rounded-lg sm:h-[106px]" />
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-lg" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-44 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </SkeletonStatus>
  );
}
