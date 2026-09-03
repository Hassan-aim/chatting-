import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 active:scale-[0.97]",
        variant === "primary" && "bg-accent text-white hover:bg-accent-muted shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]",
        variant === "ghost" && "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/[0.06]",
        variant === "danger" && "bg-danger text-white hover:bg-danger-muted shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
        className,
      )}
      {...props}
    />
  );
}
