import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-app-border bg-surface px-6 py-10 text-center">
      {icon && <div className="text-app-muted">{icon}</div>}
      <p className="text-sm font-semibold text-app-text">{title}</p>
      {description && <p className="max-w-xs text-sm text-app-muted">{description}</p>}
      {action}
    </div>
  );
}
