"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DeliveryJob, DeliveryPartnerProfile, DeliveryStatus } from "@/types/delivery";
import { demoDeliveryPartners } from "@/data/delivery-partner";
import { demoDeliveryJobs } from "@/data/delivery-jobs";
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
  isSignedIn: boolean;
  partner: DeliveryPartnerProfile | undefined;
  assignedJobs: DeliveryJob[];
  historyJobs: DeliveryJob[];
  getJob: (jobId: string) => DeliveryJob | undefined;
  updateStatus: (jobId: string, nextStatus: DeliveryStatus) => MockActionResult;
  failJob: (jobId: string, reason: string) => MockActionResult;
  reattemptJob: (jobId: string) => MockActionResult;
  returnJob: (jobId: string) => MockActionResult;
  toggleAvailability: () => void;
  signIn: (partnerId: string) => boolean;
  signOut: () => void;
  // One-off message (e.g. after sign-in) shown as a toast by the app shell.
  notice: string | null;
  clearNotice: () => void;
}

const DeliverySessionContext = createContext<DeliverySessionValue | null>(null);

const NO_SESSION_RESULT = { jobs: demoDeliveryJobs, error: "No active demo partner session." };

export function DeliverySessionProvider({ children }: { children: ReactNode }) {
  // Demo-only client state. Nothing here is persisted to a server; it resets on reload,
  // so the portal always starts signed out on the /delivery sign-in screen.
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [partners, setPartners] = useState<DeliveryPartnerProfile[]>(demoDeliveryPartners);
  const [jobs, setJobs] = useState<DeliveryJob[]>(demoDeliveryJobs);

  const partner = useMemo(() => partners.find((p) => p.id === partnerId), [partners, partnerId]);

  const assignedJobs = useMemo(
    () => (partnerId ? getAssignedJobs(jobs, partnerId) : []),
    [jobs, partnerId]
  );
  const historyJobs = useMemo(
    () => (partnerId ? getDeliveryHistory(jobs, partnerId) : []),
    [jobs, partnerId]
  );

  const getJob = useCallback(
    (jobId: string) => (partnerId ? getDeliveryJobById(jobs, partnerId, jobId) : undefined),
    [jobs, partnerId]
  );

  const applyResult = useCallback((result: MockActionResult) => {
    setJobs(result.jobs);
    return result;
  }, []);

  const updateStatus = useCallback(
    (jobId: string, nextStatus: DeliveryStatus) =>
      partnerId
        ? applyResult(updateMockDeliveryStatus(jobs, partnerId, jobId, nextStatus))
        : NO_SESSION_RESULT,
    [applyResult, jobs, partnerId]
  );

  const failJob = useCallback(
    (jobId: string, reason: string) =>
      partnerId ? applyResult(recordMockFailure(jobs, partnerId, jobId, reason)) : NO_SESSION_RESULT,
    [applyResult, jobs, partnerId]
  );

  const reattemptJob = useCallback(
    (jobId: string) =>
      partnerId ? applyResult(recordMockReattempt(jobs, partnerId, jobId)) : NO_SESSION_RESULT,
    [applyResult, jobs, partnerId]
  );

  const returnJob = useCallback(
    (jobId: string) =>
      partnerId ? applyResult(recordMockReturn(jobs, partnerId, jobId)) : NO_SESSION_RESULT,
    [applyResult, jobs, partnerId]
  );

  // Local demo state only — never touches `jobs`. Toggling availability must not
  // assign, unassign, or otherwise change any delivery.
  const toggleAvailability = useCallback(() => {
    if (!partnerId) return;
    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              availability_status: p.availability_status === "available" ? "unavailable" : "available",
            }
          : p
      )
    );
  }, [partnerId]);

  const signOut = useCallback(() => {
    setPartnerId(null);
    setNotice(null);
  }, []);

  // Starts a mock session for an explicit demo partner. Credential checks live in
  // src/services/mock-auth.ts; this only accepts IDs that exist in the demo fixtures.
  const signIn = useCallback(
    (nextPartnerId: string) => {
      if (!partners.some((p) => p.id === nextPartnerId)) return false;
      setPartnerId(nextPartnerId);
      setNotice("Signed in to the demo session.");
      return true;
    },
    [partners]
  );

  const clearNotice = useCallback(() => setNotice(null), []);

  const value: DeliverySessionValue = {
    isSignedIn: partnerId !== null,
    partner,
    assignedJobs,
    historyJobs,
    getJob,
    updateStatus,
    failJob,
    reattemptJob,
    returnJob,
    toggleAvailability,
    signIn,
    signOut,
    notice,
    clearNotice,
  };

  return <DeliverySessionContext.Provider value={value}>{children}</DeliverySessionContext.Provider>;
}

export function useDeliverySession(): DeliverySessionValue {
  const ctx = useContext(DeliverySessionContext);
  if (!ctx) throw new Error("useDeliverySession must be used within DeliverySessionProvider");
  return ctx;
}
