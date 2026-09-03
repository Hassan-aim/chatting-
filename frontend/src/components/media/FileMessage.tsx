import type { Attachment } from "../../types";
import { attachmentUrl } from "../../api/chat";
import { useAuthStore } from "../../store/auth";
import { formatBytes } from "../../utils/cn";
import { File, FileText, FileSpreadsheet, FileArchive, Download } from "lucide-react";

const ICON_MAP: Record<string, typeof File> = {
  "application/pdf": FileText,
  "text/plain": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileSpreadsheet,
  "application/zip": FileArchive,
};

export function FileMessage({ attachment }: { attachment: Attachment }) {
  const token = useAuthStore((s) => s.accessToken);
  const downloadUrl = `${attachmentUrl(attachment.id)}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  const Icon = ICON_MAP[attachment.mime_type] || File;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3 border border-white/[0.04]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/[0.12] text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">
          {attachment.file_name}
        </p>
        <p className="text-xs text-slate-500">{formatBytes(attachment.file_size)}</p>
      </div>
      <a
        href={downloadUrl}
        download={attachment.file_name}
        target="_blank"
        rel="noopener noreferrer"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
        aria-label={`Download ${attachment.file_name}`}
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}
