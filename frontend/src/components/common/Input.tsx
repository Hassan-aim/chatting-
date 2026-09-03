import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/[0.06] bg-surface-raised px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-accent focus:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-accent/30",
        className,
      )}
      {...props}
    />
  );
}
