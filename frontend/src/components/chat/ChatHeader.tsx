import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "../common/UserAvatar";
import { useChatUi } from "../../store/chatUi";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Conversation } from "../../types";
import { useAuthStore } from "../../store/auth";
import { logout } from "../../api/chat";
import { LogOut } from "lucide-react";

interface ChatHeaderProps {
  conversation: Conversation;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const navigate = useNavigate();
  const peerTyping = useChatUi((s) => s.peerTyping);
  const peerOnline = useChatUi((s) => s.peerOnline);

  const peer = conversation.peer;
  const isOnline = peerOnline ?? peer.is_online;
  const { clear, refreshToken } = useAuthStore();

  async function handleLogout() {
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // ignore
    }
    clear();
    navigate("/login");
  }

  let statusText = "Offline";
  if (peerTyping) {
    statusText = "typing…";
  } else if (isOnline) {
    statusText = "Online";
  } else if (peer.last_seen) {
    statusText = `Last seen ${formatDistanceToNow(new Date(peer.last_seen), { addSuffix: true })}`;
  }

  return (
    <header className="flex items-center gap-3 border-b border-white/5 bg-ink-900/60 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md z-10 sticky top-0">
      {/* Back button (mobile only) */}
      <button
        type="button"
        onClick={() => navigate("/chat")}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white active:-translate-y-[1px] md:hidden"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <UserAvatar name={peer.username} online={isOnline} />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-slate-100 tracking-tight">
          {peer.username}
        </h2>
        <p
          className={`truncate text-[13px] ${
            peerTyping
              ? "text-accent"
              : isOnline
                ? "text-emerald-500"
                : "text-zinc-500"
          }`}
        >
          {statusText}
        </p>
      </div>

      {/* Logout button */}
      <button
        type="button"
        onClick={handleLogout}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white active:-translate-y-[1px]"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4 stroke-[1.5]" />
      </button>
    </header>
  );
}
