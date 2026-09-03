import { useParams } from "react-router-dom";
import { ConversationList } from "../components/chat/ConversationList";
import { ChatWindow } from "../components/chat/ChatWindow";
import { useChatUi } from "../store/chatUi";

export function ChatPage() {
  const { conversationId } = useParams();
  const offline = useChatUi((s) => s.offline);

  return (
    <div className="flex h-full flex-col">
      {offline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-sm text-amber-300" role="status">
          You're offline
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <aside
          className={`w-full shrink-0 border-r border-white/[0.06] bg-surface-raised md:w-80 ${conversationId ? "hidden md:flex md:flex-col" : "flex flex-col"}`}
        >
          <ConversationList activeId={conversationId} />
        </aside>
        <section className={`min-w-0 flex-1 ${conversationId ? "flex" : "hidden md:flex"}`}>
          {conversationId ? (
            <ChatWindow conversationId={conversationId} />
          ) : (
            <div className="grid flex-1 place-items-center text-slate-600">
              <div className="text-center">
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="mt-1 text-sm">to start chatting</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
