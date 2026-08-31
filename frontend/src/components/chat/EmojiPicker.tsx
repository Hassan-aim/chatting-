import { useState, useCallback, useRef } from "react";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊",
      "😇", "🥰", "😍", "🤩", "😘", "😗", "😋", "😛", "😜", "🤪",
      "😝", "🤗", "🤭", "🤫", "🤔", "🫡", "🤐", "🤨", "😑", "😶",
      "🫥", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪",
    ],
  },
  {
    label: "Gestures",
    emojis: [
      "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘",
      "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "💪", "❤️", "🧡",
      "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💯", "💥", "🔥",
    ],
  },
  {
    label: "Objects",
    emojis: [
      "🎉", "🎊", "🎈", "✨", "🌟", "⭐", "💫", "🎵", "🎶", "📸",
      "📱", "💻", "📎", "📌", "📝", "📚", "🔔", "🕐", "☕", "🍕",
    ],
  },
  {
    label: "Nature",
    emojis: [
      "🌸", "🌺", "🌻", "🌹", "🌷", "🌼", "🌿", "☀️", "🌙", "⛅",
      "🌈", "❄️", "🐱", "🐶", "🦋", "🐝", "🐬", "🌊", "🏔️", "🌄",
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Close on click outside
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  }, []);

  const activeCategory = EMOJI_CATEGORIES[activeTab];

  return (
    <div className="relative" onBlur={handleBlur} ref={menuRef}>
      <button
        type="button"
        onClick={toggle}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
        aria-label="Emoji picker"
        aria-expanded={open}
      >
        <Smile className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`flex-1 px-2 py-2 text-xs font-medium transition ${
                  i === activeTab
                    ? "border-b-2 border-accent text-accent"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="scrollbar-thin grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto p-2">
            {activeCategory?.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-lg transition hover:bg-white/10"
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
