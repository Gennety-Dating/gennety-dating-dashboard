import { useEffect, useState } from "react";
import SectionHeader from "../SectionHeader";
import {
  getCohortRetention,
  type CohortAverageCell,
  type CohortBucket,
  type CohortCell,
  type CohortRetentionData,
  type RetentionMilestone,
} from "../../lib/api";

/**
 * Cohort retention, on the Ads page rather than in Growth, on purpose: a
 * channel that buys cheap signups who never come back is more expensive than
 * its CPL says, and that is only visible with CAC in the same eyeline.
 *
 * Two things this component refuses to do, both because the alternative would
 * be a lie the reader cannot detect:
 *
 *   • It never renders a missing measurement as 0%. `immature` (the cohort is
 *     too young) and `no-data` (the activity table does not reach that far
 *     back) are drawn differently from each other and from a real zero.
 *   • It never hides a small cohort. A 3-person week gets its number AND a
 *     `low n` flag, so the reader discounts it themselves rather than
 *     wondering why a week is missing.
 */

const BUCKETS: Array<{ value: CohortBucket; label: string }> = [
  { value: "day", label: "By day" },
  { value: "week", label: "By week" },
  { value: "month", label: "By month" },
];

function milestoneLabel(m: RetentionMilestone): string {
  return `D${m.day}`;
}

/** The window a column covers, spelled out — `D30` alone hides the width. */
function milestoneHint(m: RetentionMilestone): string {
  if (m.windowDays <= 1) return `Active on day ${m.day} exactly.`;
  return `Active on any day from ${m.day - m.windowDays + 1} to ${m.day} after signup. A ${m.windowDays}-day window because the product's own rhythm is weekly — one drop, one notice — so an exact-day reading here would measure the schedule rather than the user.`;
}

/**
 * Colour carries the value, not decoration: green reads as "held", amber as
 * "thinning", rose as "lost". Grey is reserved for the two non-measurements
 * so they can never be mistaken for a bad result.
 */
function cellTone(pct: number | null): string {
  if (pct === null) return "text-slate-600";
  if (pct >= 40) return "text-emerald-300";
  if (pct >= 20) return "text-amber-300";
  if (pct > 0) return "text-rose-300";
  return "text-rose-400";
}

function Cell({ cell }: { cell: CohortCell | CohortAverageCell }) {
  if (cell.status === "immature") {
    return (
      <span
        className="text-slate-600"
        title="Too young: not every member of this cohort has had the whole window elapse yet. This resolves itself with time."
      >
        —
      </span>
    );
  }
  if (cell.status === "no-data") {
    return (
      <span
        className="text-slate-600"
        title="Not observed: the activity table does not cover this window, so we cannot say whether anyone came back. This is a gap in instrumentation, NOT a measured zero — and unlike '—' it does not resolve with time."
      >
        ·
      </span>
    );
  }
  const sub =
    "cohorts" in cell && cell.cohorts > 0
      ? `${cell.retained}/${cell.users} across ${cell.cohorts} cohort${cell.cohorts === 1 ? "" : "s"}`
      : `${cell.retained} returned`;
  return (
    <span className={`font-bold ${cellTone(cell.retainedPct)}`} title={sub}>
      {cell.retainedPct?.toFixed(1)}%
    </span>
  );
}

export default function CohortRetentionSection() {
  const [bucket, setBucket] = useState<CohortBucket>("week");
  const [data, setData] = useState<CohortRetentionData | null>(null);
  const [error, setError] = useState("");
  // 404 is not a failure: it means the server has not shipped this endpoint yet
  // (the dashboard auto-deploys on push, so it can lead the backend by minutes).
  // A red error box would read as "the metric is broken" rather than "not live".
  const [notDeployed, setNotDeployed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCohortRetention(bucket)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError("");
        setNotDeployed(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if ((err as { status?: number }).status === 404) {
          setNotDeployed(true);
          setError("");
          return;
        }
        setNotDeployed(false);
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket]);

  const milestones = data?.milestones ?? [];

  return (
    <div className="mt-8">
      <SectionHeader
        title="Cohort retention"
        description="Of the people who registered in one bucket, how many came back N days later. Sliced by channel, because a cheap signup that never returns is not cheap. '—' means the cohort is too young to score; '·' means the activity table cannot see that window at all — neither is a zero."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {BUCKETS.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => setBucket(b.value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              bucket === b.value
                ? "bg-rose-600/25 text-rose-200"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {b.label}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-[11px] text-slate-500">
            {data.from} → {data.to} · UTC · complete through {data.coverage.lastCompleteDay}
            {data.excludedTestUsers > 0 &&
              ` · ${data.excludedTestUsers} test account${data.excludedTestUsers === 1 ? "" : "s"} excluded`}
          </span>
        )}
      </div>

      {notDeployed && (
        <div className="mb-4 rounded-2xl bg-slate-900/60 p-4 text-xs font-medium text-slate-400">
          Not on this server yet — the backend deploy carrying this endpoint has
          not landed. Nothing is wrong; the section fills in on its own once it
          does.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl bg-rose-950/40 p-4 text-xs font-medium text-rose-300">
          {error}
        </div>
      )}

      {/*
        The banner is not a nicety. With an empty activity table every cell is
        unknown, and a reader who does not know that will read a wall of '·' as
        a dead product rather than as an unplugged instrument.
      */}
      {data && data.coverage.activityFrom === null && (
        <div className="mb-4 rounded-2xl bg-amber-950/40 p-4 text-xs font-medium text-amber-200">
          <strong>No activity data at all.</strong> `user_activity_days` is empty, so
          nothing on this page can be measured yet — every cell reads “not observed”,
          which is not the same as “nobody came back”. Run the activity backfill to
          recover what history still exists; its source (`chat_events`) is swept after
          30 days, so the window closes on its own.
        </div>
      )}
      {data && data.coverage.activityFrom !== null && (
        <div className="mb-4 text-[11px] text-slate-500">
          Activity is observable from <span className="font-mono text-slate-400">{data.coverage.activityFrom}</span>.
          Cohorts whose window starts before that are marked “·” rather than scored.
        </div>
      )}

      {/* ── By channel: the row that belongs next to CAC ── */}
      <div className="glass-card-borderless mb-5 overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121316]">
              <tr className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4 text-right">Signups</th>
                {milestones.map((m) => (
                  <th key={m.day} className="px-6 py-4 text-right" title={milestoneHint(m)}>
                    {milestoneLabel(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`ch-skeleton-${i}`}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading && !notDeployed && (data?.byChannel.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={2 + milestones.length} className="px-6 py-10 text-center text-slate-500">
                    No registrations in this window.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.byChannel.map((row) => (
                  <tr key={row.channel} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-semibold whitespace-nowrap text-white">
                      {row.channel}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                      {row.signups}
                    </td>
                    {row.cells.map((cell) => (
                      <td key={cell.day} className="px-6 py-4 text-right">
                        <Cell cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── The matrix itself ── */}
      <div className="glass-card-borderless overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121316]">
              <tr className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-6 py-4">Cohort</th>
                <th className="px-6 py-4 text-right">Size</th>
                {milestones.map((m) => (
                  <th key={m.day} className="px-6 py-4 text-right" title={milestoneHint(m)}>
                    {milestoneLabel(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!loading && !notDeployed && (data?.overall.rows.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={2 + milestones.length} className="px-6 py-10 text-center text-slate-500">
                    No registrations in this window.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.overall.rows.map((row) => (
                  <tr key={row.cohort} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-mono whitespace-nowrap text-slate-300">
                      {row.cohort}
                      {row.lowSample && (
                        <span
                          className="ml-2 rounded bg-slate-500/20 px-1.5 py-0.5 text-[9px] font-bold text-slate-400"
                          title="Fewer than 20 people: one person moves this by five points or more, so read it as a direction, not a rate."
                        >
                          low n
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300">{row.size}</td>
                    {row.cells.map((cell) => (
                      <td key={cell.day} className="px-6 py-4 text-right">
                        <Cell cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading && data && data.overall.rows.length > 0 && (
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 font-bold whitespace-nowrap text-white">
                    Weighted average
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">
                    {data.overall.totalUsers}
                  </td>
                  {data.overall.average.map((cell) => (
                    <td key={cell.day} className="px-6 py-4 text-right">
                      <Cell cell={cell} />
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
