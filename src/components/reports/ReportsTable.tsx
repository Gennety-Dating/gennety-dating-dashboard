import type { ReportListItem } from "../../lib/api";

interface Props {
  reports: ReportListItem[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

const TIER_STYLES: Record<number, string> = {
  1: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  2: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  3: "bg-red-500/15 text-red-300 border-red-500/30",
};

const TIER_LABELS: Record<number, string> = {
  1: "T1 · Disappointment",
  2: "T2 · Ghosting",
  3: "T3 · Safety",
};

function TierPill({ tier }: { tier: number }) {
  const cls =
    TIER_STYLES[tier] ?? "bg-slate-500/15 text-slate-300 border-slate-500/30";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {tier === 3 && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
      )}
      {TIER_LABELS[tier] ?? `Tier ${tier}`}
    </span>
  );
}

function ReviewedPill({ reviewed }: { reviewed: boolean }) {
  return reviewed ? (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
      Reviewed
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-700/40 px-2 py-0.5 text-xs font-medium text-slate-400">
      Pending
    </span>
  );
}

function displayName(user: { firstName: string | null; surname: string | null }): string {
  const parts = [user.firstName, user.surname].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "—";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportsTable({ reports, loading, onRowClick }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60">
            <tr className="text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
              <th className="px-5 py-3">Tier</th>
              <th className="px-5 py-3">Reporter</th>
              <th className="px-5 py-3">Reported</th>
              <th className="px-5 py-3">Summary</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && reports.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  No reports found.
                </td>
              </tr>
            )}

            {!loading &&
              reports.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onRowClick(r.id)}
                  className={`cursor-pointer transition-colors hover:bg-slate-800/50 ${
                    r.tier === 3 && !r.adminReviewed
                      ? "bg-red-500/[0.04]"
                      : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <TierPill tier={r.tier} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">
                      {displayName(r.reporter)}
                    </div>
                    <div className="text-xs text-slate-500">
                      tg:{r.reporter.telegramId}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">
                      {displayName(r.reported)}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="capitalize">{r.reported.status}</span>
                      {r.reported.strikes !== undefined &&
                        r.reported.strikes > 0 &&
                        ` · ${r.reported.strikes} strike${r.reported.strikes > 1 ? "s" : ""}`}
                    </div>
                  </td>
                  <td className="max-w-[240px] truncate px-5 py-4 text-slate-300">
                    {r.reasonSummary ?? r.rawText.slice(0, 80)}
                  </td>
                  <td className="px-5 py-4">
                    <ReviewedPill reviewed={r.adminReviewed} />
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
