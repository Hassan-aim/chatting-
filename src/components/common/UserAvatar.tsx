import { cn } from "../../utils/cn";

export function UserAvatar({
  name,
  online,
  size = "md",
}: {
  name: string;
  online?: boolean;
  size?: "sm" | "md";
}) {
  const initial = name.slice(0, 1).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "grid place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 font-semibold text-white",
          size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs",
        )}
        aria-hidden
      >
        {initial}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-ink-900",
            online ? "bg-emerald-400" : "bg-slate-500",
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
