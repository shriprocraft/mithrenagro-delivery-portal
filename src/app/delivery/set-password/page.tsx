"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/delivery/AuthCard";
import { PasswordField } from "@/components/delivery/PasswordField";
import { Toast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/config/api";
import { useDeliverySession } from "@/context/delivery-session-context";
import { deliveryApi, SessionExpiredError } from "@/services/delivery-api";
import { passwordProblem } from "@/services/delivery-registration";

interface Errors {
  current?: string;
  next?: string;
  confirm?: string;
}

// First sign-in: the Super Admin issued the password (others may know it), so the partner sets their own
// before anything else opens. The backend refuses orders and pickups until this is done.
export default function SetPasswordPage() {
  const { restoring, isSignedIn, mustChangePassword, completePasswordChange, signOut, toast, clearToast } = useDeliverySession();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (restoring) return;
    if (!isSignedIn) router.replace("/delivery");
    else if (!mustChangePassword) router.replace("/delivery/pickups");
  }, [restoring, isSignedIn, mustChangePassword, router]);

  if (restoring || !isSignedIn || !mustChangePassword) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setFormError(null);
    const found: Errors = {};
    if (!current) found.current = "Enter the password you were given.";
    const problem = passwordProblem(next);
    if (problem) found.next = problem;
    else if (next === current) found.next = "Choose a password different from the one you were given.";
    if (!found.next && confirm !== next) found.confirm = "The passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      completePasswordChange(await deliveryApi.changePassword(current, next));
      // The session now allows the app; the effect above opens Available Pickups.
    } catch (error) {
      setSaving(false);
      if (error instanceof SessionExpiredError) {
        signOut();
        return;
      }
      if (error instanceof ApiRequestError && error.status === 422 && /current password/i.test(error.message)) {
        setErrors({ current: error.message });
        return;
      }
      setFormError(error instanceof Error ? error.message : "Your password couldn't be saved. Please try again.");
    }
  }

  return (
    <>
      <AuthCard
        title="Set a new password"
        subtitle="You signed in with the password Mithren Agro gave you. Choose your own password to continue."
      >
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <PasswordField
            id="current-password"
            label="Password you were given"
            value={current}
            onChange={(v) => {
              setCurrent(v);
              setErrors((e) => ({ ...e, current: undefined }));
            }}
            error={errors.current}
            placeholder="Enter the password from Mithren Agro"
            autoComplete="current-password"
            disabled={saving}
          />
          <PasswordField
            id="new-password"
            label="New password"
            value={next}
            onChange={(v) => {
              setNext(v);
              setErrors((e) => ({ ...e, next: undefined }));
            }}
            error={errors.next}
            hint="At least 10 characters, with letters and numbers."
            placeholder="Enter a new password"
            autoComplete="new-password"
            disabled={saving}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              setErrors((e) => ({ ...e, confirm: undefined }));
            }}
            error={errors.confirm}
            placeholder="Enter the new password again"
            autoComplete="new-password"
            disabled={saving}
          />
          <Button type="submit" className="mt-2 w-full" loading={saving}>
            {saving ? "Saving…" : "Save and continue"}
          </Button>
          <button
            type="button"
            onClick={signOut}
            className="text-center text-sm text-app-muted hover:text-app-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Sign out
          </button>
        </form>
      </AuthCard>
      <Toast toast={toast} onDismiss={clearToast} />
    </>
  );
}
