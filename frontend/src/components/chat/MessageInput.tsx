import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";
import type { ChatMessage } from "../../types";
import { uploadFile, sendMessageRest, editMessage } from "../../api/chat";
import { getErrorMessage } from "../../api/client";
import { createClientId } from "../../utils/cn";
import { useChatUi } from "../../store/chatUi";
import { useAuthStore } from "../../store/auth";
import { useQueryClient } from "@tanstack/react-query";
import { EmojiPicker } from "./EmojiPicker";
import { ReplyPreviewBar } from "../messages/ReplyPreview";
import { UploadProgress } from "../media/UploadProgress";
import { Send, Paperclip, X } from "lucide-react";

interface MessageInputProps {
  conversationId: string;
  peerUsername?: string;
  send: (event: string, payload: Record<string, unknown>) => boolean;
}

export function MessageInput({
  conversationId,
  peerUsername,
  send,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const isTypingRef = useRef(false);
  const queryClient = useQueryClient();

  const replyTo = useChatUi((s) => s.replyTo);
  const editing = useChatUi((s) => s.editing);
  const setReplyTo = useChatUi((s) => s.setReplyTo);
  const setEditing = useChatUi((s) => s.setEditing);
  const currentUser = useAuthStore((s) => s.user);

  // Pre-fill text when editing
  useEffect(() => {
    if (editing && editing.content) {
      setText(editing.content);
      textareaRef.current?.focus();
    }
  }, [editing]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  // Debounced typing indicator
  const sendTypingStart = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      send("typing:start", {});
    }
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      isTypingRef.current = false;
      send("typing:stop", {});
    }, 2000);
  }, [send]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      sendTypingStart();
    },
    [sendTypingStart],
  );

  const addOptimisticMessage = useCallback(
    (msg: Partial<ChatMessage>) => {
      const key = ["messages", conversationId];
      queryClient.setQueryData<{ pages: { items: ChatMessage[] }[] }>(key, (old) => {
        if (!old) return old;
        const pages = [...old.pages];
        const lastIdx = pages.length - 1;
        if (lastIdx < 0) return old;
        const page = pages[lastIdx];
        if (!page) return old;
        const optimistic: ChatMessage = {
          id: msg.client_id || createClientId(),
          conversation_id: conversationId,
          sender_id: currentUser?.id || "",
          sender: currentUser
            ? {
                id: currentUser.id,
                username: currentUser.username,
                profile_image: currentUser.profile_image,
                is_online: true,
                last_seen: null,
              }
            : null,
          message_type: msg.message_type || "text",
          content: msg.content || null,
          reply_to_message_id: msg.reply_to_message_id || null,
          reply_to: msg.reply_to || null,
          client_id: msg.client_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          edited: false,
          delivery_status: "sent",
          attachments: msg.attachments || [],
          pending: true,
          failed: false,
        };
        pages[lastIdx] = { ...page, items: [...page.items, optimistic] };
        return { ...old, pages };
      });
    },
    [conversationId, currentUser, queryClient],
  );

  const markFailed = useCallback(
    (clientId: string) => {
      const key = ["messages", conversationId];
      queryClient.setQueryData<{ pages: { items: ChatMessage[] }[] }>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            items: p.items.map((m) =>
              m.client_id === clientId ? { ...m, pending: false, failed: true } : m,
            ),
          })),
        };
      });
    },
    [conversationId, queryClient],
  );

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = text.trim();
      if (!trimmed && !editing) return;

      // Handle edit mode
      if (editing) {
        if (!trimmed) return;
        const sent = send("message:update", { id: editing.id, content: trimmed });
        if (!sent) {
          try {
            await editMessage(editing.id, trimmed);
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        }
        setText("");
        setEditing(null);
        return;
      }

      // Send new message
      const clientId = createClientId();
      const payload: Record<string, unknown> = {
        content: trimmed,
        message_type: "text",
        client_id: clientId,
      };
      if (replyTo) {
        payload.reply_to_message_id = replyTo.id;
      }

      // Optimistic UI
      addOptimisticMessage({
        content: trimmed,
        client_id: clientId,
        reply_to_message_id: replyTo?.id || null,
        reply_to: replyTo
          ? {
              id: replyTo.id,
              sender_id: replyTo.sender_id,
              content: replyTo.content,
              message_type: replyTo.message_type,
              deleted: replyTo.deleted_at !== null,
            }
          : null,
      });

      setText("");
      setReplyTo(null);

      // Stop typing
      if (isTypingRef.current) {
        isTypingRef.current = false;
        window.clearTimeout(typingTimeoutRef.current);
        send("typing:stop", {});
      }

      // Try WebSocket first, fall back to REST
      const sent = send("message:new", payload);
      if (!sent) {
        try {
          await sendMessageRest(conversationId, {
            content: trimmed,
            message_type: "text",
            client_id: clientId,
            reply_to_message_id: replyTo?.id,
          });
        } catch (err) {
          markFailed(clientId);
          toast.error(getErrorMessage(err));
        }
      }
    },
    [
      text,
      editing,
      replyTo,
      send,
      conversationId,
      setReplyTo,
      setEditing,
      addOptimisticMessage,
      markFailed,
    ],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
      if (e.key === "Escape") {
        if (editing) setEditing(null);
        if (replyTo) setReplyTo(null);
      }
    },
    [handleSubmit, editing, replyTo, setEditing, setReplyTo],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input
      e.target.value = "";

      setUploading(true);
      setUploadFileName(file.name);
      setUploadProgress(0);

      try {
        const attachment = await uploadFile(conversationId, file, (pct) =>
          setUploadProgress(pct),
        );

        // Determine message type from MIME
        let messageType = "file";
        if (attachment.mime_type.startsWith("image/")) messageType = "image";
        else if (attachment.mime_type.startsWith("video/")) messageType = "video";

        const clientId = createClientId();
        const payload = {
          content: null,
          message_type: messageType,
          client_id: clientId,
          attachment_id: attachment.id,
        };

        addOptimisticMessage({
          message_type: messageType as ChatMessage["message_type"],
          client_id: clientId,
          attachments: [attachment],
        });

        const sent = send("message:new", payload);
        if (!sent) {
          try {
            await sendMessageRest(conversationId, {
              message_type: messageType,
              client_id: clientId,
              attachment_id: attachment.id,
            });
          } catch (err) {
            markFailed(clientId);
            toast.error(getErrorMessage(err));
          }
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setUploading(false);
        setUploadProgress(0);
        setUploadFileName("");
      }
    },
    [conversationId, send, addOptimisticMessage, markFailed],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const el = textareaRef.current;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const before = text.slice(0, start);
        const after = text.slice(end);
        const newText = before + emoji + after;
        setText(newText);
        // Restore cursor position
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + emoji.length;
          el.focus();
        });
      } else {
        setText((prev) => prev + emoji);
      }
    },
    [text],
  );

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setText("");
  }, [setEditing]);

  return (
    <div className="border-t border-white/5 bg-ink-900/60 backdrop-blur-md shadow-[0_-1px_0_rgba(255,255,255,0.05)]">
      {/* Reply preview bar */}
      {replyTo && (
        <ReplyPreviewBar
          reply={{
            id: replyTo.id,
            sender_id: replyTo.sender_id,
            content: replyTo.content,
            message_type: replyTo.message_type,
            deleted: replyTo.deleted_at !== null,
          }}
          senderName={
            replyTo.sender_id === currentUser?.id
              ? "You"
              : peerUsername
          }
          onClose={() => setReplyTo(null)}
        />
      )}

      {/* Edit mode indicator */}
      {editing && (
        <div className="flex items-center gap-2 border-l-2 border-amber-400 bg-amber-400/5 px-3 py-2 text-sm">
          <span className="text-amber-400">Editing message</span>
          <button
            type="button"
            onClick={cancelEdit}
            className="ml-auto grid h-6 w-6 place-items-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Cancel edit"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="px-3 py-2">
          <UploadProgress
            fileName={uploadFileName}
            progress={uploadProgress}
          />
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-all hover:bg-white/10 hover:text-white active:-translate-y-[1px] disabled:opacity-50"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5 stroke-[1.5]" />
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.pdf,.docx,.xlsx,.txt,.zip"
          onChange={handleFileSelect}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="max-h-40 min-h-[36px] flex-1 resize-none rounded-2xl border border-white/5 bg-ink-800/80 px-4 py-2 text-[14px] text-slate-100 placeholder:text-zinc-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] focus:border-accent focus:bg-ink-800 focus:outline-none focus:ring-1 focus:ring-accent/50"
          aria-label="Message input"
        />

        {/* Emoji picker */}
        <EmojiPicker onSelect={handleEmojiSelect} />

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim() && !editing}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white transition-all hover:bg-accent-muted active:-translate-y-[1px] disabled:opacity-40"
          aria-label={editing ? "Save edit" : "Send message"}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
