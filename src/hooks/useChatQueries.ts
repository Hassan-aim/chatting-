import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConversation,
  deleteMessage,
  editMessage,
  fetchConversation,
  fetchConversations,
  fetchMessages,
  searchUsers,
  sendMessageRest,
} from "../api/chat";
import type { ChatMessage } from "../types";

export function useConversations() {
  return useQuery({ queryKey: ["conversations"], queryFn: fetchConversations });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id!),
    enabled: Boolean(id),
  });
}

export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined) ?? undefined,
    enabled: Boolean(conversationId),
  });
}

export function useUserSearch(q: string) {
  return useQuery({
    queryKey: ["users", q],
    queryFn: () => searchUsers(q),
    enabled: q.length >= 1,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useSendFallback(conversationId: string) {
  return useMutation({
    mutationFn: (payload: Parameters<typeof sendMessageRest>[1]) =>
      sendMessageRest(conversationId, payload),
  });
}

export function useEditMessage() {
  return useMutation({ mutationFn: ({ id, content }: { id: string; content: string }) => editMessage(id, content) });
}

export function useDeleteMessage() {
  return useMutation({ mutationFn: (id: string) => deleteMessage(id) });
}

export function flattenMessages(pages: { items: ChatMessage[] }[] | undefined): ChatMessage[] {
  if (!pages) return [];
  // Infinite query pages: first page is newest window; older pages prepend.
  // fetchMessages returns chronological items. Page 0 = newest 50. Next pages are older.
  const chronological: ChatMessage[] = [];
  for (let i = pages.length - 1; i >= 0; i -= 1) {
    const page = pages[i];
    if (page) chronological.push(...page.items);
  }
  const seen = new Set<string>();
  return chronological.filter((m) => {
    const key = m.id || m.client_id || "";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
