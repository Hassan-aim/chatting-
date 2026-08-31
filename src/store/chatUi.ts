import { create } from "zustand";
import type { ChatMessage } from "../types";

interface ChatUiState {
  replyTo: ChatMessage | null;
  editing: ChatMessage | null;
  typing: boolean;
  peerTyping: boolean;
  peerOnline: boolean | null;
  offline: boolean;
  setReplyTo: (msg: ChatMessage | null) => void;
  setEditing: (msg: ChatMessage | null) => void;
  setPeerTyping: (v: boolean) => void;
  setPeerOnline: (v: boolean | null) => void;
  setOffline: (v: boolean) => void;
  resetConversationUi: () => void;
}

export const useChatUi = create<ChatUiState>((set) => ({
  replyTo: null,
  editing: null,
  typing: false,
  peerTyping: false,
  peerOnline: null,
  offline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  setReplyTo: (msg) => set({ replyTo: msg, editing: null }),
  setEditing: (msg) => set({ editing: msg, replyTo: null }),
  setPeerTyping: (v) => set({ peerTyping: v }),
  setPeerOnline: (v) => set({ peerOnline: v }),
  setOffline: (v) => set({ offline: v }),
  resetConversationUi: () =>
    set({ replyTo: null, editing: null, peerTyping: false, peerOnline: null }),
}));
