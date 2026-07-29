import type { ReportListItem } from "../../lib/api";

interface Props {
  reports: ReportListItem[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

const TIER_STYLES: Record<number, string> = {
  1: "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20 shadow-sm",
  2: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 shadow-sm",
  3: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30 shadow-sm shadow-red-950/40",
};

const TIER_LABELS: Record<number, string> = {
  1: "T1 · Disappointment",
  2: "T2 · Ghosting",
  3: "T3 · Safety",
};

function TierPill({ tier }: { tier: number }) {
  const cls =
    TIER_STYLES[tier] ?? "bg-slate-500/10 text-slate-400 ring-1 ring-white/10";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      {tier === 3 && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
      )}
      {TIER_LABELS[tier] ?? `Tier ${tier}`}
    </span>
  );
}

function ReviewedPill({ reviewed }: { reviewed: boolean }) {
  return reviewed ? (
    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/20 shadow-sm">
      Reviewed
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400 ring-1 ring-white/10">
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
    <div className="overflow-hidden rounded-2xl bg-slate-900/60 shadow-xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.04] text-xs">
          <thead className="bg-slate-950/40">
            <tr className="text-left text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <th className="px-5 py-3.5">Tier</th>
              <th className="px-5 py-3.5">Reporter</th>
              <th className="px-5 py-3.5">Reported</th>
              <th className="px-5 py-3.5">Summary</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 w-24 animate-pulse rounded-lg bg-slate-800/60" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && reports.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-xs text-slate-500"
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
                  className={`group cursor-pointer transition-all duration-150 hover:bg-white/[0.03] ${
                    r.tier === 3 && !r.adminReviewed
                      ? "bg-red-500/[0.03]"
                      : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <TierPill tier={r.tier} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white transition-colors group-hover:text-violet-300">
                      {displayName(r.reporter)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      tg:{r.reporter.telegramId}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white transition-colors group-hover:text-violet-300">
                      {displayName(r.reported)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span className="capitalize">{r.reported.status}</span>
                      {r.reported.strikes !== undefined &&
                        r.reported.strikes > 0 &&
                        ` · ${r.reported.strikes} strike${r.reported.strikes > 1 ? "s" : ""}`}
                    </div>
                  </td>
                  <td className="max-w-[240px] truncate px-5 py-4 text-slate-300/90 leading-relaxed">
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
