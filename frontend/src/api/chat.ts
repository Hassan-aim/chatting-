import { api } from "./client";
import type {
  ApiSuccess,
  Attachment,
  ChatMessage,
  Conversation,
  Tokens,
  UserBrief,
  UserPublic,
} from "../types";

export async function register(username: string, email: string, password: string) {
  const { data } = await api.post<ApiSuccess<{ user: UserPublic; tokens: Tokens }>>(
    "/api/auth/register",
    { username, email, password },
  );
  return data.data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<ApiSuccess<{ user: UserPublic; tokens: Tokens }>>(
    "/api/auth/login",
    { email, password },
  );
  return data.data;
}

export async function logout(refreshToken: string) {
  await api.post("/api/auth/logout", { refresh_token: refreshToken });
}

export async function fetchMe() {
  const { data } = await api.get<ApiSuccess<UserPublic>>("/api/users/me");
  return data.data;
}

export async function searchUsers(q: string) {
  const { data } = await api.get<ApiSuccess<UserBrief[]>>("/api/users/search", { params: { q } });
  return data.data;
}

export async function fetchConversations() {
  const { data } = await api.get<ApiSuccess<Conversation[]>>("/api/conversations");
  return data.data;
}

export async function createConversation(peer_username: string) {
  const { data } = await api.post<ApiSuccess<Conversation>>("/api/conversations", {
    peer_username,
  });
  return data.data;
}

export async function fetchConversation(id: string) {
  const { data } = await api.get<ApiSuccess<Conversation>>(`/api/conversations/${id}`);
  return data.data;
}

export async function fetchMessages(conversationId: string, cursor?: string) {
  const { data } = await api.get<ApiSuccess<ChatMessage[]>>(
    `/api/conversations/${conversationId}/messages`,
    { params: { cursor, limit: 50 } },
  );
  return { items: data.data, nextCursor: data.meta?.next_cursor ?? null, hasMore: data.meta?.has_more ?? false };
}

export async function sendMessageRest(
  conversationId: string,
  payload: {
    content?: string;
    message_type?: string;
    reply_to_message_id?: string | null;
    client_id?: string;
    attachment_id?: string;
  },
) {
  const { data } = await api.post<ApiSuccess<ChatMessage>>(
    `/api/conversations/${conversationId}/messages`,
    payload,
  );
  return data.data;
}

export async function editMessage(id: string, content: string) {
  const { data } = await api.patch<ApiSuccess<ChatMessage>>(`/api/messages/${id}`, { content });
  return data.data;
}

export async function deleteMessage(id: string) {
  const { data } = await api.delete<ApiSuccess<ChatMessage>>(`/api/messages/${id}`);
  return data.data;
}

export async function uploadFile(
  conversationId: string,
  file: File,
  onProgress?: (pct: number) => void,
) {
  const form = new FormData();
  form.append("conversation_id", conversationId);
  form.append("file", file);
  const { data } = await api.post<ApiSuccess<Attachment>>("/api/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (evt.total && onProgress) onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return data.data;
}

export function attachmentUrl(id: string) {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return `${base}/api/attachments/${id}`;
}
