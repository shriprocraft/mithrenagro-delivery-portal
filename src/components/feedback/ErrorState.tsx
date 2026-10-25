import { Button } from "@/components/ui/Button";
import { XCircleIcon } from "@/components/ui/icons";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-6 py-8 text-center">
      <XCircleIcon className="h-8 w-8 text-danger" />
      <p className="text-sm font-medium text-app-text">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
