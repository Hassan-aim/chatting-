import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserSearch, useCreateConversation } from "../../hooks/useChatQueries";
import { getErrorMessage } from "../../api/client";
import { UserAvatar } from "../common/UserAvatar";
import { Search, X, MessageSquarePlus, Loader2 } from "lucide-react";

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewConversationModal({ open, onClose }: NewConversationModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading } = useUserSearch(query);
  const createConversation = useCreateConversation();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const handleSelect = useCallback(
    async (username: string) => {
      try {
        const conversation = await createConversation.mutateAsync(username);
        onClose();
        navigate(`/c/${conversation.id}`);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [createConversation, navigate, onClose],
  );

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-white/[0.06] bg-surface-raised p-0 text-slate-100 shadow-2xl backdrop:bg-black/60"
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquarePlus className="h-5 w-5 text-accent" />
            New Conversation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full rounded-xl border border-white/[0.06] bg-surface-elevated py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
            aria-label="Search users"
          />
        </div>

        <div className="scrollbar-thin mt-3 max-h-64 overflow-y-auto">
          {isLoading && query.length > 0 && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          )}

          {!isLoading && query.length > 0 && users?.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No users found
            </p>
          )}

          {users?.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user.username)}
              disabled={createConversation.isPending}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04] disabled:opacity-50"
            >
              <UserAvatar name={user.username} online={user.is_online} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">
                  {user.username}
                </p>
                <p className="text-xs text-slate-500">
                  {user.is_online ? "Online" : "Offline"}
                </p>
              </div>
            </button>
          ))}

          {query.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              Type a username to search
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
