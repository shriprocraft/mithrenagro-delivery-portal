"use client";

const controlClasses =
  "w-full rounded-md border border-app-border bg-surface px-3 py-2 text-sm text-app-text placeholder:text-app-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function FilterSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      maxLength={60}
      className={`${controlClasses} col-span-2`}
    />
  );
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      aria-label={label}
      className={controlClasses}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FilterSummary({
  resultCount,
  itemLabel,
  active,
  onClear,
}: {
  resultCount: number;
  itemLabel: string;
  active: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-app-muted">
      <p aria-live="polite">
        {resultCount} {itemLabel}
        {active ? " match your filters" : ""}
      </p>
      {active && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-sm font-medium text-primary hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
