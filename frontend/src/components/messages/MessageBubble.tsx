import { memo, useCallback, useRef, useState } from "react";
import { format } from "date-fns";
import type { ChatMessage } from "../../types";
import { cn } from "../../utils/cn";
import { StatusIndicator } from "../common/StatusIndicator";
import { InlineReplyPreview } from "./ReplyPreview";
import { MessageActions } from "./MessageActions";
import { ImageMessage } from "../media/ImageMessage";
import { VideoMessage } from "../media/VideoMessage";
import { FileMessage } from "../media/FileMessage";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  peerUsername?: string;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  onScrollToMessage?: (id: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isMine,
  peerUsername,
  onReply,
  onEdit,
  onDelete,
  onScrollToMessage,
}: MessageBubbleProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isDeleted = message.deleted_at !== null;
  const isText = message.message_type === "text";
  const isPending = Boolean(message.pending);
  const isFailed = Boolean(message.failed);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isDeleted) setActionsOpen(true);
    },
    [isDeleted],
  );

  const handleClick = useCallback(() => {
    if (!isDeleted) setActionsOpen((v) => !v);
  }, [isDeleted]);

  const replySenderName = message.reply_to
    ? message.reply_to.sender_id === message.sender_id
      ? isMine
        ? "You"
        : peerUsername
      : isMine
        ? peerUsername
        : "You"
    : undefined;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className={cn(
        "group relative flex w-full",
        isMine ? "justify-end" : "justify-start",
      )}
      data-message-id={message.id}
    >
      <div
        ref={bubbleRef}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        className={cn(
          "relative max-w-[75%] rounded-2xl px-3.5 py-2 text-sm transition-colors md:max-w-[60%]",
          isMine
            ? "rounded-br-md bg-emerald-600/20 text-slate-100 border border-emerald-500/10"
            : "rounded-bl-md bg-white/[0.06] text-slate-100 border border-white/[0.04]",
          isPending && "opacity-50",
          isFailed && "ring-1 ring-red-500/50",
        )}
      >
        {message.reply_to && !isDeleted && (
          <InlineReplyPreview
            reply={message.reply_to}
            senderName={replySenderName}
            onClick={() =>
              message.reply_to && onScrollToMessage?.(message.reply_to.id)
            }
          />
        )}

        {isDeleted ? (
          <p className="select-none italic text-slate-500">
            This message was deleted
          </p>
        ) : (
          <>
            {message.content && (
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            )}
            {message.attachments.map((att) => {
              if (message.message_type === "image") {
                return <ImageMessage key={att.id} attachment={att} />;
              }
              if (message.message_type === "video") {
                return <VideoMessage key={att.id} attachment={att} />;
              }
              return <FileMessage key={att.id} attachment={att} />;
            })}
          </>
        )}

        <div
          className={cn(
            "mt-1 flex items-center gap-1.5 text-[11px]",
            isMine ? "justify-end" : "justify-start",
            "text-slate-500",
          )}
        >
          {message.edited && !isDeleted && (
            <span className="italic">edited</span>
          )}
          <time dateTime={message.created_at}>
            {format(new Date(message.created_at), "HH:mm")}
          </time>
          {isMine && !isDeleted && (
            <>
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
              ) : (
                <StatusIndicator status={message.delivery_status} className="h-3.5 w-3.5" />
              )}
            </>
          )}
          {isFailed && (
            <span className="font-medium text-red-400">Failed</span>
          )}
        </div>

        <MessageActions
          isMine={isMine}
          isText={isText}
          isDeleted={isDeleted}
          content={message.content}
          onReply={() => onReply(message)}
          onCopy={() => {}}
          onEdit={() => onEdit(message)}
          onDelete={() => onDelete(message)}
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          anchorRef={bubbleRef}
        />
      </div>
    </motion.div>
  );
});
