import { cn } from "../../utils/cn";

const AVATAR_COLORS = [
  "from-emerald-600 to-teal-700",
  "from-cyan-600 to-blue-700",
  "from-violet-600 to-purple-700",
  "from-rose-600 to-pink-700",
  "from-amber-600 to-orange-700",
  "from-indigo-600 to-blue-700",
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

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
  const gradient = AVATAR_COLORS[getColorIndex(name)];

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "grid place-items-center rounded-full bg-gradient-to-br font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
          gradient,
          size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs",
        )}
        aria-hidden
      >
        {initial}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface",
            online ? "bg-emerald-400" : "bg-slate-500",
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
