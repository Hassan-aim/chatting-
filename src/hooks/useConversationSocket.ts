import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import { useChatUi } from "../store/chatUi";
import type { ChatMessage, WsFrame } from "../types";

const wsBase = import.meta.env.VITE_WS_BASE_URL || `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}`;

export function useConversationSocket(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<WebSocket | null>(null);
  const retries = useRef(0);
  const intentionalClose = useRef(false);

  const send = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, payload }));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!conversationId || !accessToken) return;
    intentionalClose.current = false;
    let reconnectTimer: number | undefined;

    const connect = () => {
      const url = `${wsBase}/ws/conversations/${conversationId}?token=${encodeURIComponent(accessToken)}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        retries.current = 0;
        useChatUi.getState().setOffline(false);
        send("message:read", {});
      };

      ws.onmessage = (evt) => {
        const frame = JSON.parse(evt.data) as WsFrame;
        handleFrame(conversationId, queryClient, frame);
      };

      ws.onclose = () => {
        if (intentionalClose.current) return;
        const delay = Math.min(1000 * 2 ** retries.current, 15000);
        retries.current += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      intentionalClose.current = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [conversationId, accessToken, queryClient, send]);

  return { send, socketRef };
}

function upsertMessage(list: ChatMessage[] | undefined, incoming: ChatMessage): ChatMessage[] {
  const current = list ?? [];
  const byClient = incoming.client_id
    ? current.findIndex((m) => m.client_id === incoming.client_id)
    : -1;
  const byId = current.findIndex((m) => m.id === incoming.id);
  const idx = byClient >= 0 ? byClient : byId;
  if (idx >= 0) {
    const next = [...current];
    next[idx] = { ...incoming, pending: false, failed: false };
    return next;
  }
  return [...current, incoming];
}

function handleFrame(
  conversationId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  frame: WsFrame,
) {
  const key = ["messages", conversationId];
  if (frame.event === "message:new" || frame.event === "message:ack") {
    const msg = frame.payload as unknown as ChatMessage;
    queryClient.setQueryData<{ pages: { items: ChatMessage[] }[] }>(key, (old) => {
      if (!old) return old;
      const pages = [...old.pages];
      const last = pages.length - 1;
      if (last < 0) return old;
      const page = pages[last];
      if (!page) return old;
      pages[last] = { ...page, items: upsertMessage(page.items, msg) };
      return { ...old, pages };
    });
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    return;
  }
  if (frame.event === "message:update" || frame.event === "message:delete") {
    const msg = frame.payload as unknown as ChatMessage;
    queryClient.setQueryData<{ pages: { items: ChatMessage[] }[] }>(key, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          items: p.items.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)),
        })),
      };
    });
    return;
  }
  if (frame.event === "message:delivered" || frame.event === "message:read") {
    const ids = (frame.payload.message_ids as string[]) || [];
    const status = frame.event === "message:read" ? "read" : "delivered";
    queryClient.setQueryData<{ pages: { items: ChatMessage[] }[] }>(key, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          items: p.items.map((m) => (ids.includes(m.id) ? { ...m, delivery_status: status } : m)),
        })),
      };
    });
    return;
  }
  if (frame.event === "typing:start") useChatUi.getState().setPeerTyping(true);
  if (frame.event === "typing:stop") useChatUi.getState().setPeerTyping(false);
  if (frame.event === "presence:online") useChatUi.getState().setPeerOnline(true);
  if (frame.event === "presence:offline") useChatUi.getState().setPeerOnline(false);
}
