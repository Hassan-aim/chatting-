import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  children,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 m-auto max-w-sm rounded-2xl border border-white/[0.06] bg-surface-raised p-0 text-slate-100 shadow-2xl backdrop:bg-black/60"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        )}
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 border border-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition active:scale-[0.97]",
              variant === "danger"
                ? "bg-danger hover:bg-danger-muted"
                : "bg-accent hover:bg-accent-muted",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
