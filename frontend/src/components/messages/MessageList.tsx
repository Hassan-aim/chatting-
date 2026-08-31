import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import type { ChatMessage } from "../../types";
import { MessageBubble } from "./MessageBubble";
import { Skeleton } from "../common/Skeleton";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  peerUsername?: string;
  hasMore: boolean;
  isFetchingMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
}

type ListItem =
  | { type: "date"; date: string; key: string }
  | { type: "message"; message: ChatMessage; key: string };

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d, yyyy");
}

function buildItems(messages: ChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDate: Date | null = null;

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at);
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      const dateKey = format(msgDate, "yyyy-MM-dd");
      items.push({ type: "date", date: msg.created_at, key: `date-${dateKey}` });
      lastDate = msgDate;
    }
    items.push({ type: "message", message: msg, key: msg.id || msg.client_id || "" });
  }
  return items;
}

export function MessageList({
  messages,
  currentUserId,
  peerUsername,
  hasMore,
  isFetchingMore,
  isLoading,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const prevLengthRef = useRef(messages.length);
  const prevScrollHeightRef = useRef(0);

  const items = useMemo(() => buildItems(messages), [messages]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = items[index];
      return item?.type === "date" ? 40 : 72;
    },
    overscan: 10,
  });

  // Auto-scroll to bottom for new messages when we're "stuck" there
  useEffect(() => {
    if (stickToBottom && messages.length > prevLengthRef.current) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(items.length - 1, { align: "end" });
      });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, stickToBottom, virtualizer, items.length]);

  // Preserve scroll position when loading older messages
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    if (
      !isFetchingMore &&
      prevScrollHeightRef.current > 0 &&
      el.scrollHeight > prevScrollHeightRef.current
    ) {
      const diff = el.scrollHeight - prevScrollHeightRef.current;
      el.scrollTop += diff;
    }
    prevScrollHeightRef.current = el.scrollHeight;
  }, [items.length, isFetchingMore]);

  // Detect scroll position for stick-to-bottom behavior
  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setStickToBottom(atBottom);

    // Trigger load-more when scrolled near top
    if (el.scrollTop < 200 && hasMore && !isFetchingMore) {
      prevScrollHeightRef.current = el.scrollHeight;
      onLoadMore();
    }
  }, [hasMore, isFetchingMore, onLoadMore]);

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = items.findIndex(
        (i) => i.type === "message" && i.message.id === messageId,
      );
      if (index >= 0) {
        virtualizer.scrollToIndex(index, { align: "center" });
        // Flash highlight
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-message-id="${messageId}"]`);
          if (el) {
            el.classList.add("bg-accent/10");
            setTimeout(() => el.classList.remove("bg-accent/10"), 1500);
          }
        });
      }
    },
    [items, virtualizer],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <Skeleton className={`h-12 ${i % 3 === 0 ? "w-48" : "w-64"} rounded-2xl`} />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="grid flex-1 place-items-center p-4">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-400">No messages yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Send a message to start the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="scrollbar-thin flex-1 overflow-y-auto"
      role="log"
      aria-label="Message history"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
          width: "100%",
        }}
      >
        {/* Loading older messages indicator */}
        {isFetchingMore && (
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        )}

        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {item.type === "date" ? (
                <div className="flex justify-center py-3">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-400">
                    {formatDateSeparator(item.date)}
                  </span>
                </div>
              ) : (
                <div className="px-4 py-0.5">
                  <MessageBubble
                    message={item.message}
                    isMine={item.message.sender_id === currentUserId}
                    peerUsername={peerUsername}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onScrollToMessage={scrollToMessage}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
