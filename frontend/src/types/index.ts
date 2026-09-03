export type MessageType = "text" | "image" | "video" | "file";
export type DeliveryState = "sent" | "delivered" | "read";

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  profile_image: string | null;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}

export interface UserBrief {
  id: string;
  username: string;
  profile_image: string | null;
  is_online: boolean;
  last_seen: string | null;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  peer: UserBrief;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_pinned: boolean;
  is_muted: boolean;
}

export interface SearchMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string | null;
  content: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ReplyPreview {
  id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  deleted: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: UserBrief | null;
  message_type: MessageType | string;
  content: string | null;
  reply_to_message_id: string | null;
  reply_to?: ReplyPreview | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  edited: boolean;
  delivery_status: DeliveryState;
  attachments: Attachment[];
  pending?: boolean;
  failed?: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { next_cursor?: string | null; has_more?: boolean };
}

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string };
}

export interface WsFrame {
  event: string;
  payload: Record<string, unknown>;
}
