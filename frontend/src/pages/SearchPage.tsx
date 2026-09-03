import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import { searchMessages } from "../api/chat";
import type { SearchMessage } from "../types";
import { ArrowLeft, Search, MessageSquare, Loader2 } from "lucide-react";

export function SearchPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchMessages(q);
      setResults(data);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => doSearch(query), 300);
    return () => window.clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent/20 text-accent rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.95]"
          aria-label="Back to chat"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-100">Search Messages</h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all conversations..."
            autoFocus
            className="w-full rounded-xl border border-white/[0.06] bg-surface-raised py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </motion.div>

        {searched && !loading && results.length === 0 && (
          <div className="py-12 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-500">No messages found</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((msg) => (
              <Link
                key={msg.id}
                to={`/c/${msg.conversation_id}`}
                className="block rounded-xl border border-white/[0.06] bg-surface-raised p-4 transition hover:border-white/[0.12] hover:bg-surface-elevated"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-accent">
                    {msg.sender_username || "Unknown"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2">
                  {highlightMatch(msg.content || "", query)}
                </p>
              </Link>
            ))}
          </div>
        )}

        {!searched && !loading && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-500">
              Type to search across all your conversations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
