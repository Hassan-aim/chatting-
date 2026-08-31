import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useConversations } from "../../hooks/useChatQueries";
import { useAuthStore } from "../../store/auth";
import { logout } from "../../api/chat";
import type { Conversation } from "../../types";
import { UserAvatar } from "../common/UserAvatar";
import { Skeleton } from "../common/Skeleton";
import { NewConversationModal } from "./NewConversationModal";
import { cn } from "../../utils/cn";
import { Plus, LogOut, MessageSquare } from "lucide-react";

interface ConversationListProps {
  activeId?: string;
}

export function ConversationList({ activeId }: ConversationListProps) {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const [newModalOpen, setNewModalOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const { clear, refreshToken } = useAuthStore();

  const handleLogout = useCallback(async () => {
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // ignore
    }
    clear();
    navigate("/login");
  }, [refreshToken, clear, navigate]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-semibold text-slate-100">Nexus</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setNewModalOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white active:-translate-y-[1px]"
            aria-label="New conversation"
          >
            <Plus className="h-5 w-5 stroke-[1.5]" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white active:-translate-y-[1px] md:hidden"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Current user badge */}
      {currentUser && (
        <div className="border-b border-white/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <UserAvatar name={currentUser.username} online size="sm" />
            <span className="truncate text-sm text-slate-300">
              {currentUser.username}
            </span>
          </div>
        </div>
      )}

      {/* List */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto" aria-label="Conversations">
        {isLoading && (
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && conversations?.length === 0 && (
          <div className="px-4 py-12 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-500">No conversations yet</p>
            <button
              type="button"
              onClick={() => setNewModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-muted"
            >
              <Plus className="h-4 w-4" />
              Start a conversation
            </button>
          </div>
        )}

        {conversations?.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            active={conv.id === activeId}
            onClick={() => navigate(`/c/${conv.id}`)}
          />
        ))}
      </nav>

      <NewConversationModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
      />
    </>
  );
}

function ConversationItem({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const peer = conversation.peer;
  const time = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: false,
      })
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-3 text-left transition",
        active
          ? "bg-accent/10 border-r-2 border-accent"
          : "hover:bg-white/5",
      )}
      aria-current={active ? "page" : undefined}
    >
      <UserAvatar name={peer.username} online={peer.is_online} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium text-slate-100">
            {peer.username}
          </span>
          {time && (
            <span className="ml-2 shrink-0 text-[11px] text-slate-500">
              {time}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="truncate text-xs text-slate-400">
            {conversation.last_message_preview || "No messages yet"}
          </p>
          {conversation.unread_count > 0 && (
            <span className="ml-2 grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
              {conversation.unread_count > 99
                ? "99+"
                : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
