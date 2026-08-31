import { cn } from "../../utils/cn";
import { X } from "lucide-react";

interface UploadProgressProps {
  fileName: string;
  progress: number;
  onCancel?: () => void;
  className?: string;
}

export function UploadProgress({
  fileName,
  progress,
  onCancel,
  className,
}: UploadProgressProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="truncate text-slate-200">{fileName}</span>
          <span className="ml-2 shrink-0 text-xs text-slate-400">
            {progress}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Cancel upload"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
