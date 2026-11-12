"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DeliveryJob, DeliveryPartnerProfile, DeliveryStatus } from "@/types/delivery";
import type { ToastMessage, ToastTone } from "@/components/feedback/Toast";
import { demoDeliveryPartners } from "@/data/delivery-partner";
import { demoDeliveryJobs } from "@/data/delivery-jobs";
import { logoutDeliveryPartner, type DeliveryPartnerProfile as BackendPartnerProfile } from "@/services/delivery-registration";
import { deliveryApi, readSession, saveSession, SessionExpiredError } from "@/services/delivery-api";
import {
  getAssignedJobs,
  getDeliveryHistory,
  getDeliveryJobById,
  recordMockFailure,
  recordMockReattempt,
  recordMockReturn,
  updateMockDeliveryStatus,
  type MockActionResult,
} from "@/services/delivery-service";

interface DeliverySessionValue {
  // True until the stored session (if any) has been read on page load; pages wait for it so a reload
  // doesn't bounce a signed-in partner to the sign-in screen.
  restoring: boolean;
  isSignedIn: boolean;
  // A registered partner signed in on the backend (real orders), as opposed to a demo partner.
  isBackendPartner: boolean;
  partner: DeliveryPartnerProfile | undefined;
  assignedJobs: DeliveryJob[];
  historyJobs: DeliveryJob[];
  // Registered partners' orders come from the backend.
  jobsLoading: boolean;
  jobsError: string | null;
  reloadJobs: () => void;
  getJob: (jobId: string) => DeliveryJob | undefined;
  updateStatus: (jobId: string, nextStatus: DeliveryStatus) => MockActionResult | Promise<MockActionResult>;
  failJob: (jobId: string, reason: string) => MockActionResult;
  reattemptJob: (jobId: string) => MockActionResult;
  returnJob: (jobId: string) => MockActionResult;
  // Resolves to an error message, or null when the change was saved.
  toggleAvailability: () => Promise<string | null>;
  signIn: (partnerId: string) => boolean;
  // Starts a session for a partner who signed in on the backend (registered accounts).
  signInPartner: (profile: BackendPartnerProfile) => void;
  signOut: () => void;
  // App-wide toast, rendered by the app shell and the sign-in screen. Living here (not in
  // individual components) keeps a toast visible even when the component that raised it
  // re-renders into a different branch, e.g. after a status change.
  toast: ToastMessage | null;
  showToast: (message: string, tone?: ToastTone) => void;
  clearToast: () => void;
}

const DeliverySessionContext = createContext<DeliverySessionValue | null>(null);

const NO_SESSION_RESULT = { jobs: demoDeliveryJobs, error: "No active partner session." };
const NOT_FOR_BACKEND = "This action isn't available for your deliveries yet.";

function toPartner(profile: BackendPartnerProfile): DeliveryPartnerProfile {
  return {
    id: profile.partner_id,
    name: profile.full_name,
    phone: profile.phone,
    vehicle_type: { bike: "Bike", scooter: "Scooter", ev: "EV" }[profile.vehicle_type],
    availability_status: profile.availability_status,
  };
}

export function DeliverySessionProvider({ children }: { children: ReactNode }) {
  // The session is kept in localStorage (src/services/delivery-api.ts) and restored on load, so the
  // partner stays signed in across reloads until they sign out. Demo partners' jobs are local demo data
  // and reset on reload; registered partners' orders come from the backend.
  const [restoring, setRestoring] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isBackendPartner, setIsBackendPartner] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [partners, setPartners] = useState<DeliveryPartnerProfile[]>(demoDeliveryPartners);
  const [jobs, setJobs] = useState<DeliveryJob[]>(demoDeliveryJobs);
  const [backendJobs, setBackendJobs] = useState<DeliveryJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobsVersion, setJobsVersion] = useState(0);

  const partner = useMemo(() => partners.find((p) => p.id === partnerId), [partners, partnerId]);
  const currentJobs = isBackendPartner ? backendJobs : jobs;

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const endSession = useCallback(() => {
    setPartnerId(null);
    setIsBackendPartner(false);
    setBackendJobs([]);
    setJobsError(null);
    void logoutDeliveryPartner();
  }, []);

  const applyBackendProfile = useCallback((profile: BackendPartnerProfile) => {
    const next = toPartner(profile);
    setPartners((prev) => [...prev.filter((p) => p.id !== next.id), next]);
    setPartnerId(next.id);
    setIsBackendPartner(true);
    saveSession({ kind: "backend", profile });
  }, []);

  // The backend no longer accepts the session: sign out and say why.
  const sessionExpired = useCallback(() => {
    endSession();
    showToast("Your session has expired. Sign in again.", "error");
  }, [endSession, showToast]);

  // Restore a stored session on page load. A registered partner's profile is shown at once and then
  // refreshed from the backend (GET /delivery/auth/me), which also checks the session is still valid.
  useEffect(() => {
    const stored = readSession();
    if (stored?.kind === "demo" && demoDeliveryPartners.some((p) => p.id === stored.partnerId)) {
      setPartnerId(stored.partnerId);
    } else if (stored?.kind === "backend") {
      applyBackendProfile(stored.profile);
      deliveryApi
        .me()
        .then(applyBackendProfile)
        .catch((error) => {
          if (error instanceof SessionExpiredError) sessionExpired();
          // Other errors (server unreachable): keep the stored session and try again on the next request.
        });
    }
    setRestoring(false);
  }, [applyBackendProfile, sessionExpired]);

  // Registered partners: load their orders whenever they sign in or ask to refresh.
  useEffect(() => {
    if (!isBackendPartner || !partnerId) return;
    let cancelled = false;
    setJobsLoading(true);
    setJobsError(null);
    deliveryApi
      .orders(partnerId)
      .then((loaded) => {
        if (!cancelled) setBackendJobs(loaded);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof SessionExpiredError) sessionExpired();
        else setJobsError(error instanceof Error ? error.message : "Your deliveries couldn't be loaded.");
      })
      .finally(() => {
        if (!cancelled) setJobsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isBackendPartner, partnerId, jobsVersion, sessionExpired]);

  const reloadJobs = useCallback(() => setJobsVersion((v) => v + 1), []);

  const assignedJobs = useMemo(
    () => (partnerId ? getAssignedJobs(currentJobs, partnerId) : []),
    [currentJobs, partnerId]
  );
  const historyJobs = useMemo(
    () => (partnerId ? getDeliveryHistory(currentJobs, partnerId) : []),
    [currentJobs, partnerId]
  );

  const getJob = useCallback(
    (jobId: string) => (partnerId ? getDeliveryJobById(currentJobs, partnerId, jobId) : undefined),
    [currentJobs, partnerId]
  );

  const applyResult = useCallback((result: MockActionResult) => {
    setJobs(result.jobs);
    return result;
  }, []);

  const updateStatus = useCallback(
    (jobId: string, nextStatus: DeliveryStatus): MockActionResult | Promise<MockActionResult> => {
      if (!partnerId) return NO_SESSION_RESULT;
      if (!isBackendPartner) return applyResult(updateMockDeliveryStatus(jobs, partnerId, jobId, nextStatus));
      const job = getDeliveryJobById(backendJobs, partnerId, jobId);
      if (!job) return { jobs: backendJobs, error: "This delivery is not available." };
      return deliveryApi
        .setStatus(partnerId, job, nextStatus)
        .then((updated) => {
          setBackendJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
          return { jobs: [], job: updated };
        })
        .catch((error) => {
          if (error instanceof SessionExpiredError) sessionExpired();
          // The order may have changed elsewhere: reload so the screen shows its real status.
          else reloadJobs();
          return { jobs: [], error: error instanceof Error ? error.message : "The status couldn't be updated." };
        });
    },
    [applyResult, backendJobs, isBackendPartner, jobs, partnerId, reloadJobs, sessionExpired]
  );

  const failJob = useCallback(
    (jobId: string, reason: string) =>
      !partnerId
        ? NO_SESSION_RESULT
        : isBackendPartner
          ? { jobs: backendJobs, error: NOT_FOR_BACKEND }
          : applyResult(recordMockFailure(jobs, partnerId, jobId, reason)),
    [applyResult, backendJobs, isBackendPartner, jobs, partnerId]
  );

  const reattemptJob = useCallback(
    (jobId: string) =>
      !partnerId
        ? NO_SESSION_RESULT
        : isBackendPartner
          ? { jobs: backendJobs, error: NOT_FOR_BACKEND }
          : applyResult(recordMockReattempt(jobs, partnerId, jobId)),
    [applyResult, backendJobs, isBackendPartner, jobs, partnerId]
  );

  const returnJob = useCallback(
    (jobId: string) =>
      !partnerId
        ? NO_SESSION_RESULT
        : isBackendPartner
          ? { jobs: backendJobs, error: NOT_FOR_BACKEND }
          : applyResult(recordMockReturn(jobs, partnerId, jobId)),
    [applyResult, backendJobs, isBackendPartner, jobs, partnerId]
  );

  // Never touches jobs: toggling availability doesn't assign, unassign or change any delivery.
  // Demo partners: local only. Registered partners: saved on the backend.
  const toggleAvailability = useCallback(async (): Promise<string | null> => {
    if (!partner) return "No active partner session.";
    const next = partner.availability_status === "available" ? "unavailable" : "available";
    if (!isBackendPartner) {
      setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, availability_status: next } : p)));
      return null;
    }
    try {
      applyBackendProfile(await deliveryApi.setAvailability(next));
      return null;
    } catch (error) {
      if (error instanceof SessionExpiredError) sessionExpired();
      return error instanceof Error ? error.message : "Availability couldn't be updated.";
    }
  }, [applyBackendProfile, isBackendPartner, partner, sessionExpired]);

  const signOut = useCallback(() => {
    endSession();
    showToast("Signed out.");
  }, [endSession, showToast]);

  const signInPartner = useCallback(
    (profile: BackendPartnerProfile) => {
      applyBackendProfile(profile);
      showToast(`Welcome, ${profile.full_name.split(" ")[0]}! You're signed in.`);
    },
    [applyBackendProfile, showToast]
  );

  // Starts a session for an explicit demo partner. Credential checks live in
  // src/services/mock-auth.ts; this only accepts IDs that exist in the demo fixtures.
  const signIn = useCallback(
    (nextPartnerId: string) => {
      if (!partners.some((p) => p.id === nextPartnerId)) return false;
      setIsBackendPartner(false);
      setPartnerId(nextPartnerId);
      saveSession({ kind: "demo", partnerId: nextPartnerId });
      showToast("Signed in to the demo session.");
      return true;
    },
    [partners, showToast]
  );

  const clearToast = useCallback(() => setToast(null), []);

  const value: DeliverySessionValue = {
    restoring,
    isSignedIn: partnerId !== null,
    isBackendPartner,
    partner,
    assignedJobs,
    historyJobs,
    jobsLoading,
    jobsError,
    reloadJobs,
    getJob,
    updateStatus,
    failJob,
    reattemptJob,
    returnJob,
    toggleAvailability,
    signIn,
    signInPartner,
    signOut,
    toast,
    showToast,
    clearToast,
  };

  return <DeliverySessionContext.Provider value={value}>{children}</DeliverySessionContext.Provider>;
}

export function useDeliverySession(): DeliverySessionValue {
  const ctx = useContext(DeliverySessionContext);
  if (!ctx) throw new Error("useDeliverySession must be used within DeliverySessionProvider");
  return ctx;
}
