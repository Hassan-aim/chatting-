export function TypingIndicator({ username }: { username?: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400" role="status" aria-live="polite">
      <span className="flex gap-0.5">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
      </span>
      <span>{username || "Friend"} is typing…</span>
    </div>
  );
}
