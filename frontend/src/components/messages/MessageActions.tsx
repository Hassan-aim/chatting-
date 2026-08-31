import { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";
import { Reply, Copy, Pencil, Trash2 } from "lucide-react";

interface MessageActionsProps {
  isMine: boolean;
  isText: boolean;
  isDeleted: boolean;
  content?: string | null;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Control external open state */
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Position anchor */
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function MessageActions({
  isMine,
  isText,
  isDeleted,
  content,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  open,
  onOpenChange,
  anchorRef,
}: MessageActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<"above" | "below">("above");

  useEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      setPosition(rect.top > 200 ? "above" : "below");
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange, anchorRef]);

  if (!open || isDeleted) return null;

  const items: Array<{
    label: string;
    icon: typeof Reply;
    action: () => void;
    danger?: boolean;
    show: boolean;
  }> = [
    { label: "Reply", icon: Reply, action: onReply, show: true },
    {
      label: "Copy",
      icon: Copy,
      action: () => {
        if (content) void navigator.clipboard.writeText(content);
        onCopy();
      },
      show: Boolean(isText && content),
    },
    { label: "Edit", icon: Pencil, action: onEdit, show: isMine && isText },
    {
      label: "Delete",
      icon: Trash2,
      action: onDelete,
      danger: true,
      show: isMine,
    },
  ];

  const visible = items.filter((i) => i.show);

  return (
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        "absolute z-30 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-ink-900 py-1 shadow-xl",
        isMine ? "right-0" : "left-0",
        position === "above" ? "bottom-full mb-1" : "top-full mt-1",
      )}
    >
      {visible.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          onClick={() => {
            item.action();
            onOpenChange(false);
          }}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition",
            item.danger
              ? "text-rose-400 hover:bg-rose-500/10"
              : "text-slate-200 hover:bg-white/5",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
