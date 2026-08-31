import { useCallback, useEffect, useRef } from "react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={handleClick}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] max-w-[90vw] bg-transparent p-0 backdrop:bg-black/80"
    >
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <img
          src={src}
          alt={alt || "Full size image"}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        />
      </div>
    </dialog>
  );
}
