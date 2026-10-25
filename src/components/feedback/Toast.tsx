"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function Toast({
  message,
  onDismiss,
  tone = "neutral",
}: {
  message: string | null;
  onDismiss: () => void;
  tone?: "neutral" | "success";
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-pill px-4 py-2.5 text-sm text-white shadow-raised",
              tone === "success" ? "bg-primary" : "bg-app-text"
            )}
          >
            <CheckCircleIcon className={cn("h-4 w-4", tone === "success" ? "text-white" : "text-success")} />
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
