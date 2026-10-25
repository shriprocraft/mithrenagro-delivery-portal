"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PROVISIONAL_FAILURE_REASONS } from "@/lib/failure-reasons";

export function FailureReasonForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState(PROVISIONAL_FAILURE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  const isOther = selected === "Other";
  const reason = (isOther ? customReason : selected).trim();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (reason) onSubmit(reason);
      }}
    >
      <p className="text-xs text-app-muted">
        Provisional reason list — pending business confirmation, not a finalized requirement.
      </p>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Failure reason</legend>
        {PROVISIONAL_FAILURE_REASONS.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-app-text">
            <input
              type="radio"
              name="failure-reason"
              value={option}
              checked={selected === option}
              onChange={() => setSelected(option)}
              className="h-4 w-4 accent-primary"
            />
            {option}
          </label>
        ))}
      </fieldset>
      {isOther && (
        <label className="flex flex-col gap-1 text-sm text-app-text">
          Describe the reason
          <input
            type="text"
            value={customReason}
            onChange={(event) => setCustomReason(event.target.value)}
            className="rounded-md border border-app-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            required
          />
        </label>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" disabled={!reason}>
          Confirm failed delivery
        </Button>
      </div>
    </form>
  );
}
