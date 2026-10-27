"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useDeliverySession } from "@/context/delivery-session-context";
import { PROVISIONAL_FAILURE_REASONS } from "@/lib/failure-reasons";
import { cn } from "@/lib/cn";

const MIN_CUSTOM_REASON_LENGTH = 5;
const MAX_CUSTOM_REASON_LENGTH = 200;

export function FailureReasonForm({
  onSubmit,
  onCancel,
  submitting = false,
}: {
  onSubmit: (reason: string) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const { showToast } = useDeliverySession();
  const [selected, setSelected] = useState(PROVISIONAL_FAILURE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const isOther = selected === "Other";
  const reason = (isOther ? customReason : selected).trim();

  function validate(): string | null {
    if (!isOther) return null;
    if (!reason) return "Describe the reason for the failed delivery.";
    if (reason.length < MIN_CUSTOM_REASON_LENGTH) {
      return `The reason must be at least ${MIN_CUSTOM_REASON_LENGTH} characters.`;
    }
    return null;
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (submitting) return;
        const error = validate();
        setCustomError(error);
        if (error) {
          showToast(error, "error");
          return;
        }
        onSubmit(reason);
      }}
    >
      <p className="text-xs text-app-muted">
        Provisional reason list — pending business confirmation, not a finalized requirement.
      </p>
      <fieldset className="flex flex-col gap-2" disabled={submitting}>
        <legend className="sr-only">Failure reason</legend>
        {PROVISIONAL_FAILURE_REASONS.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-app-text">
            <input
              type="radio"
              name="failure-reason"
              value={option}
              checked={selected === option}
              onChange={() => {
                setSelected(option);
                setCustomError(null);
              }}
              className="h-4 w-4 accent-primary"
            />
            {option}
          </label>
        ))}
      </fieldset>
      {isOther && (
        <div className="flex flex-col gap-1">
          <label htmlFor="failure-custom-reason" className="text-sm text-app-text">
            Describe the reason <span className="text-danger">*</span>
          </label>
          <input
            id="failure-custom-reason"
            type="text"
            value={customReason}
            onChange={(event) => {
              setCustomReason(event.target.value);
              if (customError) setCustomError(null);
            }}
            placeholder="e.g. Gate locked, security did not allow entry"
            maxLength={MAX_CUSTOM_REASON_LENGTH}
            disabled={submitting}
            aria-invalid={customError ? true : undefined}
            aria-describedby={customError ? "failure-custom-reason-error" : undefined}
            className={cn(
              "rounded-md border px-3 py-2 text-sm placeholder:text-app-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              customError ? "border-danger" : "border-app-border"
            )}
            required
          />
          {customError && (
            <p id="failure-custom-reason-error" className="text-xs text-danger">
              {customError}
            </p>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" loading={submitting}>
          {submitting ? "Saving…" : "Confirm failed delivery"}
        </Button>
      </div>
    </form>
  );
}
