import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useConversations } from "../../hooks/useChatQueries";
import { useAuthStore } from "../../store/auth";
import { logout, togglePin, toggleMute } from "../../api/chat";
import type { Conversation } from "../../types";
import { UserAvatar } from "../common/UserAvatar";
import { Skeleton } from "../common/Skeleton";
import { NewConversationModal } from "./NewConversationModal";
import { cn } from "../../utils/cn";
import { Plus, LogOut, MessageSquare, Search, Settings, Pin, PinOff, BellOff, Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ConversationListProps {
  activeId?: string;
}

export function ConversationList({ activeId }: ConversationListProps) {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const [newModalOpen, setNewModalOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const { clear, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();

  const sortedConversations = useMemo(() => {
    if (!conversations) return [];
    return [...conversations].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [conversations]);

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
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
            <MessageSquare className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          </div>
          <h1 className="text-base font-semibold text-slate-100">Nexus</h1>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.95]"
            aria-label="Search messages"
          >
            <Search className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.95]"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => setNewModalOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.95]"
            aria-label="New conversation"
          >
            <Plus className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.95] md:hidden"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {currentUser && (
        <div className="border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={currentUser.username} online size="sm" />
            <span className="truncate text-sm text-slate-300">
              {currentUser.username}
            </span>
          </div>
        </div>
      )}

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
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-muted active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              Start a conversation
            </button>
          </div>
        )}

        {sortedConversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            active={conv.id === activeId}
            onClick={() => navigate(`/c/${conv.id}`)}
            onTogglePin={async () => {
              await togglePin(conv.id);
              void queryClient.invalidateQueries({ queryKey: ["conversations"] });
            }}
            onToggleMute={async () => {
              await toggleMute(conv.id);
              void queryClient.invalidateQueries({ queryKey: ["conversations"] });
            }}
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
  onTogglePin,
  onToggleMute,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
  onTogglePin: () => void;
  onToggleMute: () => void;
}) {
  const peer = conversation.peer;
  const time = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: false,
      })
    : "";

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-3 text-left transition",
          active
            ? "bg-accent/[0.08] border-r-2 border-accent"
            : "hover:bg-white/[0.03]",
          conversation.is_pinned && !active && "bg-white/[0.02]",
        )}
        aria-current={active ? "page" : undefined}
      >
        <UserAvatar name={peer.username} online={peer.is_online} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-100">
              {conversation.is_pinned && (
                <Pin className="h-3 w-3 shrink-0 text-accent" />
              )}
              {peer.username}
            </span>
            {time && (
              <span className="ml-2 shrink-0 text-[11px] text-slate-500">
                {time}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="truncate text-xs text-slate-500">
              {conversation.is_muted && (
                <BellOff className="inline h-3 w-3 mr-1 text-slate-600" />
              )}
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

      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-surface-raised/90 rounded-lg px-1 py-0.5 shadow-lg z-10 border border-white/[0.06]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="grid h-6 w-6 place-items-center rounded text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
          aria-label={conversation.is_pinned ? "Unpin" : "Pin"}
        >
          {conversation.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="grid h-6 w-6 place-items-center rounded text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
          aria-label={conversation.is_muted ? "Unmute" : "Mute"}
        >
          {conversation.is_muted ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
