import { useState, useCallback, useRef } from "react";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: [
      "\u{1F600}", "\u{1F603}", "\u{1F604}", "\u{1F601}", "\u{1F606}", "\u{1F605}", "\u{1F923}", "\u{1F602}", "\u{1F642}", "\u{1F60A}",
      "\u{1F607}", "\u{1F970}", "\u{1F60D}", "\u{1F929}", "\u{1F618}", "\u{1F617}", "\u{1F60B}", "\u{1F61B}", "\u{1F61C}", "\u{1F92A}",
      "\u{1F61D}", "\u{1F917}", "\u{1F92D}", "\u{1F92B}", "\u{1F914}", "\u{1FAE1}", "\u{1F910}", "\u{1F928}", "\u{1F611}", "\u{1F636}",
    ],
  },
  {
    label: "Gestures",
    emojis: [
      "\u{1F44D}", "\u{1F44E}", "\u{1F44C}", "\u{1F90C}", "\u{1F90F}", "\u270C\uFE0F", "\u{1F91E}", "\u{1FAF0}", "\u{1F91F}", "\u{1F918}",
      "\u{1F44F}", "\u{1F64C}", "\u{1FAF6}", "\u{1F450}", "\u{1F932}", "\u{1F91D}", "\u{1F64F}", "\u{1F4AA}", "\u2764\uFE0F", "\u{1F9E1}",
    ],
  },
  {
    label: "Objects",
    emojis: [
      "\u{1F389}", "\u{1F38A}", "\u{1F388}", "\u2728", "\u{1F31F}", "\u2B50", "\u{1F4AB}", "\u{1F3B5}", "\u{1F3B6}", "\u{1F4F8}",
      "\u{1F4F1}", "\u{1F4BB}", "\u{1F4CE}", "\u{1F4CC}", "\u{1F4DD}", "\u{1F4DA}", "\u{1F514}", "\u{1F550}", "\u2615", "\u{1F355}",
    ],
  },
  {
    label: "Nature",
    emojis: [
      "\u{1F338}", "\u{1F33A}", "\u{1F33B}", "\u{1F339}", "\u{1F337}", "\u{1F33C}", "\u{1F33F}", "\u2600\uFE0F", "\u{1F319}", "\u26C5",
      "\u{1F308}", "\u2744\uFE0F", "\u{1F431}", "\u{1F436}", "\u{1F98B}", "\u{1F41D}", "\u{1F42C}", "\u{1F30A}", "\u{1F3D4}\uFE0F", "\u{1F304}",
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
        className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
        aria-label="Emoji picker"
        aria-expanded={open}
      >
        <Smile className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 overflow-hidden rounded-xl border border-white/[0.06] bg-surface-raised shadow-xl">
          <div className="flex border-b border-white/[0.06]">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`flex-1 px-2 py-2 text-xs font-medium transition ${
                  i === activeTab
                    ? "border-b-2 border-accent text-accent"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="scrollbar-thin grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto p-2">
            {activeCategory?.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-lg transition hover:bg-white/[0.06]"
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
