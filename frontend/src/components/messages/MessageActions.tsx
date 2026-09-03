import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../../utils/cn";
import { Reply, Copy, Pencil, Trash2, Check } from "lucide-react";

interface MessageActionsProps {
  isMine: boolean;
  isText: boolean;
  isDeleted: boolean;
  content?: string | null;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
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
  const [copied, setCopied] = useState(false);

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

  const handleCopy = useCallback(async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        onCopy();
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // fallback
      }
    }
  }, [content, onCopy]);

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
      label: copied ? "Copied" : "Copy",
      icon: copied ? Check : Copy,
      action: handleCopy,
      show: Boolean(isText && content),
    },
    { label: "Edit", icon: Pencil, action: onEdit, show: isMine && isText },
    { label: "Delete", icon: Trash2, action: onDelete, danger: true, show: isMine },
  ];

  const visible = items.filter((i) => i.show);

  return (
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        "absolute z-30 min-w-[140px] overflow-hidden rounded-xl border border-white/[0.06] bg-surface-raised py-1 shadow-xl",
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
            if (item.label !== "Copy") onOpenChange(false);
          }}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition",
            item.danger
              ? "text-red-400 hover:bg-red-500/10"
              : "text-slate-200 hover:bg-white/[0.06]",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
