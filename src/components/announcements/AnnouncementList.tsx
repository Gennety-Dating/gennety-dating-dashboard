import type { AdminAnnouncement } from "../../lib/api";
import { formatCount, formatDateTime } from "../../lib/announcements";
import StatusPill from "./StatusPill";

interface Props {
  rows: AdminAnnouncement[];
  loading: boolean;
  refreshing: boolean;
  selectedId: string | null;
  /** A brand-new unsaved announcement is open — no row is selected, but the list is not idle either. */
  composingNew: boolean;
  showArchived: boolean;
  archivedCount: number;
  onSelect: (id: string) => void;
  onShowArchivedChange: (next: boolean) => void;
  onRefresh: () => void;
}

function whenLabel(a: AdminAnnouncement): string {
  switch (a.status) {
    case "scheduled":
      return `for ${formatDateTime(a.scheduledAt)}`;
    case "sending":
      return `since ${formatDateTime(a.scheduledAt)}`;
    case "sent":
      return formatDateTime(a.sentAt);
    case "archived":
      return a.sentAt ? formatDateTime(a.sentAt) : formatDateTime(a.createdAt);
    default:
      return formatDateTime(a.createdAt);
  }
}

/** The numbers worth a glance for each state — none for a draft, which has reached nobody. */
function statsLabel(a: AdminAnnouncement): string | null {
  if (a.status === "sending") {
    return a.sendPush
      ? `${formatCount(a.pendingPushCount)} pushes pending · ${formatCount(a.readCount)} read`
      : `${formatCount(a.readCount)} read`;
  }
  if (a.recipientCount !== null) {
    return `${formatCount(a.recipientCount)} recipients · ${formatCount(a.readCount)} read`;
  }
  return null;
}

export default function AnnouncementList({
  rows,
  loading,
  refreshing,
  selectedId,
  composingNew,
  showArchived,
  archivedCount,
  onSelect,
  onShowArchivedChange,
  onRefresh,
}: Props) {
  return (
    <>
      <div className="min-h-0 flex-1 divide-y divide-white/[0.04] overflow-y-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 px-4 py-3.5">
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
              <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/5" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs font-medium text-slate-500">
            {composingNew
              ? "Nothing saved yet."
              : archivedCount > 0 && !showArchived
                ? "Nothing active. Archived announcements are hidden."
                : "No announcements yet."}
          </p>
        ) : (
          rows.map((a) => {
            const active = a.id === selectedId;
            const stats = statsLabel(a);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelect(a.id)}
                aria-current={active ? "true" : undefined}
                className={`block w-full cursor-pointer px-4 py-3.5 text-left transition-colors ${
                  active ? "bg-white/8" : "hover:bg-white/[0.02]"
                } ${a.status === "archived" ? "opacity-60" : ""}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-slate-100">{a.title}</span>
                  <span className="shrink-0 text-[10px] font-medium text-slate-500 tabular-nums">
                    {whenLabel(a)}
                  </span>
                </div>
                <div className="mt-1.5 flex min-w-0 items-center gap-2 text-[10px]">
                  <StatusPill status={a.status} />
                  {stats ? (
                    <span className="truncate text-slate-400 tabular-nums">{stats}</span>
                  ) : (
                    <span className="truncate text-slate-500">{a.teaser}</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-400 select-none hover:text-slate-200">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-slate-400"
          />
          Show archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="btn cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </>
  );
}
