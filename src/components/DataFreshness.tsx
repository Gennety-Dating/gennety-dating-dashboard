interface Props {
  /** When the server actually computed these numbers (`X-Data-Generated-At`). */
  generatedAt: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

/** "3m ago" / "1h 12m ago" — the age of the numbers, not of the page load. */
function describeAge(iso: string): string | null {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

/**
 * Says how old the analytics on screen are, and forces a recompute.
 *
 * The heavy endpoints are served from a server-side cache with TTLs from 10 to
 * 60 minutes, so a freshly loaded page can be showing hour-old numbers with
 * nothing on screen admitting it. Refresh passes `?fresh=1`, which bypasses
 * that cache — a button that re-served the same cached payload would be worse
 * than no button, because it would assert currency it did not deliver.
 *
 * Anything older than 20 minutes is called out in amber: below that the age is
 * ordinary cache behaviour, above it the operator is probably reading numbers
 * from before whatever they just changed.
 */
export default function DataFreshness({ generatedAt, refreshing, onRefresh }: Props) {
  const age = generatedAt ? describeAge(generatedAt) : null;
  const stale = generatedAt
    ? Date.now() - new Date(generatedAt).getTime() > 20 * 60 * 1000
    : false;

  return (
    <div className="flex items-center gap-2">
      {age && (
        <span
          title={`Computed ${new Date(generatedAt!).toLocaleString()} — server-side cache`}
          className={`hidden text-[11px] tabular-nums sm:inline ${
            stale ? "text-amber-300" : "text-slate-500"
          }`}
        >
          data {age}
        </span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        title="Recompute server-side, bypassing the analytics cache"
        className="btn cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium disabled:cursor-wait disabled:opacity-50"
      >
        {refreshing ? "Refreshing…" : "↻ Refresh"}
      </button>
    </div>
  );
}
