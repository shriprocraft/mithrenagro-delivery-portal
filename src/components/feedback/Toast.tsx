"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircleIcon, XCircleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "error";

export interface ToastMessage {
  // Unique per toast, so repeating the same message still restarts the timer and animation.
  id: number;
  message: string;
  tone: ToastTone;
}

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, toast.tone === "error" ? 4500 : 3000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const isError = toast?.tone === "error";
  const Icon = isError ? XCircleIcon : CheckCircleIcon;

  return (
    // Top-anchored so it never covers the bottom nav, dialog inputs, or dialog actions.
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            role={isError ? "alert" : "status"}
            aria-live={isError ? "assertive" : "polite"}
            initial={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-2 rounded-pill px-4 py-2.5 text-sm text-white shadow-raised",
              isError ? "bg-danger" : "bg-primary"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0 text-white" />
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="ml-1 rounded-full px-1 text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
