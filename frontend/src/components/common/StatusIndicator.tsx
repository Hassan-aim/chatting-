import type { DeliveryState } from "../../types";
import { cn } from "../../utils/cn";

function SingleCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="currentColor">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function DoubleCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="currentColor">
      <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
    </svg>
  );
}

export function StatusIndicator({
  status,
  className,
}: {
  status: DeliveryState;
  className?: string;
}) {
  if (status === "read") {
    return <DoubleCheck className={cn("text-emerald-400", className)} />;
  }
  if (status === "delivered") {
    return <DoubleCheck className={cn("text-slate-400", className)} />;
  }
  return <SingleCheck className={cn("text-slate-500", className)} />;
}
