import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useConversation, useMessages, flattenMessages } from "../../hooks/useChatQueries";
import { useConversationSocket } from "../../hooks/useConversationSocket";
import { useAuthStore } from "../../store/auth";
import { useChatUi } from "../../store/chatUi";
import { getErrorMessage } from "../../api/client";
import { deleteMessage as deleteMessageApi } from "../../api/chat";
import type { ChatMessage } from "../../types";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "../messages/MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Skeleton } from "../common/Skeleton";
import { useQueryClient } from "@tanstack/react-query";

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const currentUser = useAuthStore((s) => s.user);
  const peerTyping = useChatUi((s) => s.peerTyping);
  const setReplyTo = useChatUi((s) => s.setReplyTo);
  const setEditing = useChatUi((s) => s.setEditing);
  const queryClient = useQueryClient();

  const { data: conversation, isLoading: convLoading } =
    useConversation(conversationId);
  const {
    data: messagesData,
    isLoading: msgsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(conversationId);

  const { send } = useConversationSocket(conversationId);

  const messages = flattenMessages(messagesData?.pages);

  // Mark messages as read when viewing
  const handleSendRead = useCallback(() => {
    send("message:read", {});
  }, [send]);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);

  const handleReply = useCallback(
    (msg: ChatMessage) => {
      setReplyTo(msg);
    },
    [setReplyTo],
  );

  const handleEdit = useCallback(
    (msg: ChatMessage) => {
      setEditing(msg);
    },
    [setEditing],
  );

  const handleDeleteRequest = useCallback((msg: ChatMessage) => {
    setDeleteTarget(msg);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const msgId = deleteTarget.id;

    // Try WebSocket first
    const sent = send("message:delete", { id: msgId });
    if (!sent) {
      try {
        await deleteMessageApi(msgId);
        // Update local cache
        const key = ["messages", conversationId];
        queryClient.setQueryData<{ pages: { items: ChatMessage[] }[] }>(key, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((m) =>
                m.id === msgId
                  ? { ...m, deleted_at: new Date().toISOString(), content: null }
                  : m,
              ),
            })),
          };
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
    setDeleteTarget(null);
  }, [deleteTarget, send, conversationId, queryClient]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage) void fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  // Send read receipt when conversation comes into view
  if (messages.length > 0) {
    handleSendRead();
  }

  if (convLoading) {
    return (
      <div className="flex flex-1 flex-col bg-ink-950">
        <div className="flex items-center gap-3 border-b border-white/10 bg-ink-900 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="grid flex-1 place-items-center text-slate-500">
        Conversation not found
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-ink-950">
      <ChatHeader conversation={conversation} />

      <MessageList
        messages={messages}
        currentUserId={currentUser?.id || ""}
        peerUsername={conversation.peer.username}
        hasMore={Boolean(hasNextPage)}
        isFetchingMore={isFetchingNextPage}
        isLoading={msgsLoading}
        onLoadMore={handleLoadMore}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      {peerTyping && (
        <TypingIndicator username={conversation.peer.username} />
      )}

      <MessageInput
        conversationId={conversationId}
        peerUsername={conversation.peer.username}
        send={send}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete message"
        description="This message will be deleted for everyone. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
