export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-10 text-sm text-app-muted">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-app-border border-t-primary motion-reduce:animate-none" />
      <span>{label}</span>
    </div>
  );
}
