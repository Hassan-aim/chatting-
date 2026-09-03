import type { ReplyPreview as ReplyPreviewType } from "../../types";
import { cn } from "../../utils/cn";
import { X, CornerUpLeft, Image, Film, FileText } from "lucide-react";

const TYPE_ICONS: Record<string, typeof Image> = {
  image: Image,
  video: Film,
  file: FileText,
};

interface ReplyPreviewBarProps {
  reply: ReplyPreviewType;
  senderName?: string;
  onClose?: () => void;
  className?: string;
}

export function ReplyPreviewBar({
  reply,
  senderName,
  onClose,
  className,
}: ReplyPreviewBarProps) {
  const Icon = TYPE_ICONS[reply.message_type];

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-l-2 border-accent bg-accent/[0.06] px-3 py-2",
        className,
      )}
    >
      <CornerUpLeft className="h-4 w-4 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        {senderName && (
          <p className="text-xs font-medium text-accent">{senderName}</p>
        )}
        {reply.deleted ? (
          <p className="truncate text-xs italic text-slate-500">
            Message deleted
          </p>
        ) : (
          <p className="flex items-center gap-1 truncate text-xs text-slate-400">
            {Icon && <Icon className="h-3 w-3 shrink-0 text-slate-500" />}
            {reply.content
              ? reply.content.slice(0, 80)
              : reply.message_type !== "text"
                ? `${reply.message_type.charAt(0).toUpperCase()}${reply.message_type.slice(1)}`
                : ""}
          </p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
          aria-label="Cancel reply"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface InlineReplyPreviewProps {
  reply: ReplyPreviewType;
  senderName?: string;
  onClick?: () => void;
}

export function InlineReplyPreview({
  reply,
  senderName,
  onClick,
}: InlineReplyPreviewProps) {
  const Icon = TYPE_ICONS[reply.message_type];

  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-1 block w-full rounded-lg border-l-2 border-accent/40 bg-white/[0.04] px-2.5 py-1.5 text-left transition hover:bg-white/[0.07]"
    >
      {senderName && (
        <p className="text-[11px] font-medium text-accent">{senderName}</p>
      )}
      {reply.deleted ? (
        <p className="truncate text-xs italic text-slate-500">
          Message deleted
        </p>
      ) : (
        <p className="flex items-center gap-1 truncate text-xs text-slate-500">
          {Icon && <Icon className="h-3 w-3 shrink-0" />}
          {reply.content
            ? reply.content.slice(0, 60)
            : reply.message_type !== "text"
              ? `${reply.message_type.charAt(0).toUpperCase()}${reply.message_type.slice(1)}`
              : ""}
        </p>
      )}
    </button>
  );
}
