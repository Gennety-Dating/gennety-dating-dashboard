import type { ReportListItem } from "../../lib/api";

interface Props {
  reports: ReportListItem[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

const TIER_STYLES: Record<number, string> = {
  1: "bg-sky-950/40 text-sky-300 [box-shadow:inset_0_1px_1px_rgba(14,165,233,0.3)]",
  2: "bg-amber-950/40 text-amber-300 [box-shadow:inset_0_1px_1px_rgba(245,158,11,0.3)]",
  3: "bg-rose-950/60 text-rose-200 [box-shadow:inset_0_1px_1.5px_rgba(244,63,94,0.4),inset_0_0_10px_rgba(244,63,94,0.2)]",
};

const TIER_LABELS: Record<number, string> = {
  1: "T1 · Disappointment",
  2: "T2 · Ghosting",
  3: "T3 · Safety",
};

function TierPill({ tier }: { tier: number }) {
  const cls =
    TIER_STYLES[tier] ?? "bg-slate-900 text-slate-400 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold ${cls}`}
    >
      {tier === 3 && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
        </span>
      )}
      {TIER_LABELS[tier] ?? `Tier ${tier}`}
    </span>
  );
}

function ReviewedPill({ reviewed }: { reviewed: boolean }) {
  return reviewed ? (
    <span className="inline-flex items-center rounded-full bg-emerald-950/40 px-3 py-0.5 text-[11px] font-bold text-emerald-300 [box-shadow:inset_0_1px_1px_rgba(16,185,129,0.3)]">
      Reviewed
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-0.5 text-[11px] font-bold text-slate-400 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]">
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
    <div className="glass-card-borderless overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.03] text-xs">
          <thead className="bg-slate-950/70">
            <tr className="text-left text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <th className="px-6 py-4">Tier</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Reported</th>
              <th className="px-6 py-4">Summary</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3.5 w-24 animate-pulse rounded-xl bg-slate-800/50" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && reports.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-xs font-medium text-slate-500"
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
                  className={`group cursor-pointer transition-all duration-150 hover:bg-white/[0.02] ${
                    r.tier === 3 && !r.adminReviewed
                      ? "bg-rose-950/20"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <TierPill tier={r.tier} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white transition-colors group-hover:text-rose-300">
                      {displayName(r.reporter)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400">
                      tg:{r.reporter.telegramId}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white transition-colors group-hover:text-rose-300">
                      {displayName(r.reported)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400">
                      <span className="capitalize">{r.reported.status}</span>
                      {r.reported.strikes !== undefined &&
                        r.reported.strikes > 0 &&
                        ` · ${r.reported.strikes} strike${r.reported.strikes > 1 ? "s" : ""}`}
                    </div>
                  </td>
                  <td className="max-w-[240px] truncate px-6 py-4 font-medium text-slate-300/90 leading-relaxed">
                    {r.reasonSummary ?? r.rawText.slice(0, 80)}
                  </td>
                  <td className="px-6 py-4">
                    <ReviewedPill reviewed={r.adminReviewed} />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-400">
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
