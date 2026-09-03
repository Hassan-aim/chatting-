import { useState, useCallback } from "react";
import type { Attachment } from "../../types";
import { attachmentUrl } from "../../api/chat";
import { useAuthStore } from "../../store/auth";
import { ImageLightbox } from "../common/ImageLightbox";

export function ImageMessage({ attachment }: { attachment: Attachment }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const token = useAuthStore((s) => s.accessToken);

  const src = `${attachmentUrl(attachment.id)}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={openLightbox}
        className="group relative block max-w-xs overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`View ${attachment.file_name}`}
      >
        {!loaded && (
          <div className="h-40 w-60 animate-pulse rounded-xl bg-white/[0.06]" />
        )}
        <img
          src={src}
          alt={attachment.file_name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`max-h-72 rounded-xl object-cover transition group-hover:brightness-90 ${loaded ? "" : "h-0 overflow-hidden"}`}
        />
      </button>
      <ImageLightbox
        src={src}
        alt={attachment.file_name}
        open={lightboxOpen}
        onClose={closeLightbox}
      />
    </>
  );
}
