import { useRef, useState } from "react";
import type { Attachment } from "../../types";
import { attachmentUrl } from "../../api/chat";
import { useAuthStore } from "../../store/auth";
import { Play } from "lucide-react";

export function VideoMessage({ attachment }: { attachment: Attachment }) {
  const token = useAuthStore((s) => s.accessToken);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = `${attachmentUrl(attachment.id)}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  function handlePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="relative max-w-xs overflow-hidden rounded-xl">
      {!loaded && (
        <div className="h-40 w-60 animate-pulse rounded-xl bg-white/[0.06]" />
      )}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        controls={playing}
        onLoadedData={() => setLoaded(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={`max-h-72 w-full rounded-xl ${loaded ? "" : "h-0 overflow-hidden"}`}
        aria-label={attachment.file_name}
      />
      {loaded && !playing && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 grid place-items-center bg-black/30 transition hover:bg-black/40"
          aria-label="Play video"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-surface shadow-lg">
            <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
