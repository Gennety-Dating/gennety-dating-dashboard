import type { AnnouncementStatus } from "../../lib/api";
import { STATUS_LABEL, STATUS_STYLE } from "../../lib/announcements";

export default function StatusPill({ status }: { status: AnnouncementStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
        STATUS_STYLE[status] ?? "bg-slate-500/20 text-slate-300"
      }`}
    >
      {/* The one moving mark on the page, and only while the worker is actually delivering. */}
      {status === "sending" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" aria-hidden />}
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
