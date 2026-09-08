import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SectionHeader from "../SectionHeader";
import StatCard from "../StatCard";
import ChartCard from "../charts/ChartCard";
import ErrorBanner from "../ErrorBanner";
import { AXIS_TICK, TOOLTIP_STYLE } from "../../lib/chartTheme";
import {
  getViralityAnomalies,
  getViralityClusters,
  getViralityCohorts,
  getViralitySummary,
  type ClusterDimension,
  type ViralityAnomaliesData,
  type ViralityClustersData,
  type ViralityCohortCell,
  type ViralityCohortsData,
  type ViralityGranularity,
  type ViralityRange,
  type ViralitySummaryData,
} from "../../lib/api";

/**
 * Virality & K-factor.
 *
 * The one thing this section refuses to do is print a number where there is no
 * measurement. Every `null` from the API means "we could not compute this", and
 * each has its own reason — the cohort is still maturing, there was no paid
 * seed to divide by, or the click funnel is missing data that predates the
 * events table. Rendering any of those as `0.00` would tell the reader that
 * virality is absent when the truthful statement is that it is unmeasured, and
 * those two lead to opposite decisions.
 *
 * The second rule is that the K-factor is never shown as a single number
 * without the day it was measured on. A cohort's K keeps growing for a month
 * after it registers, so "K = 0.05" is meaningless until you know whether that
 * is D1 or D30 — and comparing the two is comparing a week to a month.
 */

const RANGE_PRESETS: Array<{ days: number; label: string }> = [
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 120, label: "120d" },
];

const GRANULARITIES: Array<{ value: ViralityGranularity; label: string }> = [
  { value: "day", label: "By day" },
  { value: "week", label: "By week" },
];

const DIMENSIONS: Array<{ value: ClusterDimension; label: string }> = [
  { value: "city", label: "By city" },
  { value: "university", label: "By university" },
];

/** UTC day key `N` days back from today, inclusive of today. */
function dayKey(offsetDays: number): string {
  const now = new Date();
  const at = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offsetDays),
  );
  return at.toISOString().slice(0, 10);
}

/** The em dash that means "not measured". Never a zero. */
const NONE = "—";

function num(value: number | null | undefined, digits = 3): string {
  return value === null || value === undefined ? NONE : value.toFixed(digits);
}

function pct(value: number | null | undefined): string {
  return value === null || value === undefined ? NONE : `${(value * 100).toFixed(1)}%`;
}

function hours(value: number | null | undefined): string {
  if (value === null || value === undefined) return NONE;
  if (value < 48) return `${value.toFixed(0)}h`;
  return `${(value / 24).toFixed(1)}d`;
}

/**
 * Colour carries the K-factor's meaning, and the thresholds are not arbitrary:
 * K ≥ 1 is self-sustaining growth, so it gets the only emerald in the section.
 * Everything below is amber or slate — a product at K = 0.3 is not failing, it
 * is subsidised, and painting it red would be editorialising.
 */
function kTone(k: number | null): string {
  if (k === null) return "text-slate-600";
  if (k >= 1) return "text-emerald-300";
  if (k >= 0.3) return "text-amber-300";
  return "text-slate-300";
}

/**
 * A cohort-matrix cell.
 *
 * The number shown is **K_direct**, not the blended K, and that is the one
 * place this section departs from how the metric is described elsewhere. The
 * reason is visible the moment you put blended K in a maturity matrix: K_wom is
 * a property of the cohort's acquisition DAY, not of the cohort, so it is
 * identical in every column of a row and does not mature at all. A row then
 * reads `1.853 · 1.853 · 1.853 · 1.853` — four columns of a constant, with the
 * only quantity that actually matures buried inside it. Worse, on a day with
 * two paid signups a K_wom of 9 swamps a K_direct of 0.17 entirely.
 *
 * So the matrix shows what matures, and the tooltip carries the blend. The
 * blended figure keeps its place in the KPI card and in the API, where it is
 * read against a period rather than against a maturity axis.
 */
function CohortCell({ cell }: { cell: ViralityCohortCell | undefined }) {
  if (!cell) {
    return (
      <span className="text-slate-700" title="No row for this maturity day.">
        ·
      </span>
    );
  }
  const detail =
    `K_direct ${cell.kDirect.toFixed(3)} · ` +
    `K_wom ${cell.kWom === null ? NONE : cell.kWom.toFixed(3)} (acquisition day, does not mature) · ` +
    `blended ${cell.kTotal.toFixed(3)} · ` +
    `${cell.activations} activation(s) from ${cell.linkClicks} click(s) · ` +
    `cycle ${hours(cell.cycleTimeMedianHours)}`;

  if (!cell.mature) {
    return (
      <span
        className={`${kTone(cell.kDirect)} opacity-40`}
        title={`Still maturing: the observation window has not closed, so this is a floor, not a result. ${detail}`}
      >
        {cell.kDirect.toFixed(3)}
        <span className="ml-0.5 align-super text-[9px]">•</span>
      </span>
    );
  }
  return (
    <span className={`font-semibold ${kTone(cell.kDirect)}`} title={detail}>
      {cell.kDirect.toFixed(3)}
    </span>
  );
}

interface LoadState {
  summary: ViralitySummaryData | null;
  cohorts: ViralityCohortsData | null;
  clusters: ViralityClustersData | null;
  anomalies: ViralityAnomaliesData | null;
}

export default function ViralitySection() {
  const [days, setDays] = useState(30);
  const [granularity, setGranularity] = useState<ViralityGranularity>("day");
  const [dimension, setDimension] = useState<ClusterDimension>("city");
  const [data, setData] = useState<LoadState>({
    summary: null,
    cohorts: null,
    clusters: null,
    anomalies: null,
  });
  const [error, setError] = useState("");
  // 404 is not a failure: the dashboard auto-deploys on push and can lead the
  // backend by minutes. A red box would read as "the metric is broken".
  const [notDeployed, setNotDeployed] = useState(false);
  const [loading, setLoading] = useState(true);

  const range: ViralityRange = useMemo(
    () => ({ from: dayKey(days - 1), to: dayKey(0) }),
    [days],
  );

  // `setLoading(true)` deliberately absent from the effect body. It would fire
  // a synchronous setState on every range change (the lint rule the two older
  // self-loading sections still trip), and it bought nothing: the spinner below
  // only renders while there is no data at all, so on a refetch it flipped a
  // flag nobody could see. What the reader actually needs during a refetch is
  // "these numbers are for the previous range", and that is derived from the
  // response itself — see `showingStaleRange`.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getViralitySummary(range, granularity, "global"),
      getViralityCohorts(range, "global"),
      getViralityClusters(range, dimension, 7),
      getViralityAnomalies(range),
    ])
      .then(([summary, cohorts, clusters, anomalies]) => {
        if (cancelled) return;
        setData({ summary, cohorts, clusters, anomalies });
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
  }, [range, granularity, dimension]);

  const { summary, cohorts, clusters, anomalies } = data;
  const maturityDays = cohorts?.maturityDays ?? [1, 3, 7, 14, 30];

  /**
   * True while what is on screen answers a different question than the controls
   * now ask. Derived from the response rather than tracked in state: the
   * response carries the range it was computed for, so it can say this about
   * itself and no flag can fall out of step with it.
   */
  const showingStaleRange =
    summary !== null &&
    (summary.range.from !== range.from || summary.granularity !== granularity);

  const chartData = useMemo(
    () =>
      (summary?.series ?? []).map((point) => ({
        bucket: point.bucket,
        organic: point.organicSignups,
        referral: point.referralSignups,
        seed: point.seedSignups,
        baseline: point.baselineOrganic,
      })),
    [summary],
  );

  const kSeries = useMemo(() => {
    const rows = cohorts?.cohorts ?? [];
    // A single maturity day across all cohorts — mixing D7 and D30 on one line
    // would draw the passage of time as a trend.
    return rows
      .map((row) => ({
        cohortDate: row.cohortDate,
        cohortSize: row.cohortSize,
        kDirect: row.byMaturity["7"]?.mature ? row.byMaturity["7"].kDirect : null,
        kTotal: row.byMaturity["7"]?.mature ? row.byMaturity["7"].kTotal : null,
      }))
      .filter((row) => row.kTotal !== null);
  }, [cohorts]);

  return (
    <div className="mt-8">
      <SectionHeader
        title="Virality & K-factor"
        description="How many new users each cohort brings in by itself — directly through invite links (K_direct) and indirectly through word of mouth that leaves no link (K_wom). Every '—' means the figure could not be computed, never that it is zero; hover any cell for the reason."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => setDays(preset.days)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium ${
              days === preset.days ? "btn-primary" : "btn"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <span className="mx-1 text-slate-700">|</span>
        {GRANULARITIES.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => setGranularity(g.value)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium ${
              granularity === g.value ? "btn-primary" : "btn"
            }`}
          >
            {g.label}
          </button>
        ))}
        {summary && (
          <span className="ml-auto text-[11px] text-slate-500">
            {showingStaleRange && (
              <span className="mr-2 text-amber-300/80">updating…</span>
            )}
            {summary.range.from} → {summary.range.to} · UTC
          </span>
        )}
      </div>

      {notDeployed && (
        <div className="mb-4 rounded-md bg-slate-900/60 p-4 text-xs font-medium text-slate-400">
          Not on this server yet — the backend deploy carrying these endpoints
          has not landed. Nothing is wrong; the section fills in on its own once
          it does.
        </div>
      )}

      {error && <ErrorBanner className="mb-4" message={error} />}

      {/* Staleness is stated before any number is read. The rollup runs nightly,
          so a missed cron looks exactly like a collapse in virality — and that
          misreading costs more than the metric is worth. */}
      {summary?.stale && (
        <div className="mb-4 rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-200/90">
          {summary.rollupAt === null
            ? "The rollup has never run: every figure below is empty because nothing has been computed yet, not because virality is zero."
            : `The rollup last ran ${Math.round(summary.rollupAgeHours ?? 0)}h ago (${summary.rollupAt}). Everything below describes that moment, not now.`}
        </div>
      )}

      {loading && !summary && (
        <p className="text-xs text-slate-500">Loading…</p>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={`K total${summary.kpi.maturityDay ? ` · D${summary.kpi.maturityDay}` : ""}`}
              value={num(summary.kpi.kTotal)}
              accent
              sub={
                summary.kpi.maturityDay
                  ? `${summary.kpi.matureCohorts} of ${summary.kpi.cohorts} cohorts mature`
                  : "no mature cohort in range"
              }
              info="K_direct + K_wom, measured on the longest maturity day that has at least one closed cohort. K ≥ 1 means the product grows without being fed; below that, every new user still has to be bought or earned some other way."
              lowSample={summary.kpi.matureCohorts > 0 && summary.kpi.matureCohorts < 3}
            />
            <StatCard
              label="K direct"
              value={num(summary.kpi.kDirect)}
              sub={
                summary.shareFunnel
                  ? `${summary.shareFunnel.activations} activations / ${summary.shareFunnel.cohortSize} people`
                  : undefined
              }
              info="Invited friends who cleared verification, divided by the size of the cohort that invited them. Verification, not signup: that is the point where the product itself pays the referrer, and measuring anything earlier would call viral what we decline to pay for."
            />
            <StatCard
              label="K word-of-mouth"
              value={num(summary.kpi.kWom)}
              sub={
                summary.wom.calibration.confidence === "low"
                  ? "not dependable — see note below"
                  : `${summary.wom.calibration.method} · ${summary.wom.measurableDays} measurable days`
              }
              info={`Organic signups above their own 14-day baseline, divided by paid/campaign signups in the same period. Method: ${summary.wom.calibration.reason}.`}
              lowSample={summary.wom.calibration.confidence === "low"}
            />
            <StatCard
              label="Viral cycle time"
              value={hours(summary.kpi.cycleTimeMedianHours)}
              sub="referrer signup → invitee activation"
              info="Median time from a referrer registering to one of their invitees clearing verification. This is what sets how fast K compounds: the same K with half the cycle time doubles the growth rate."
            />
          </div>

          {/* The K_wom formula has a precondition — a baseline that actually
              explains the level organic sits at — and on a growing product it
              silently stops holding. Saying so next to the number is the whole
              difference between a metric and a plausible-looking wrong answer. */}
          {summary.wom.calibration.confidence === "low" && (
            <div className="mt-3 rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200/90">
              <span className="font-semibold">
                K_wom is not dependable for this range.
              </span>
              <ul className="mt-1 list-disc pl-4">
                {summary.wom.calibration.confidenceReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p className="mt-1 text-amber-200/70">
                K direct and the share funnel below are unaffected — they are
                counted, not inferred.
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            <ChartCard
              title="Acquisition split & organic baseline"
              description="Stacked signups by how they arrived, with the rolling organic baseline drawn over them. The gap between the organic bar and the baseline line is the word-of-mouth uplift the K_wom figure is built from."
              legend="Bars: signups by source. Line: the 14-day trailing organic baseline — the level organic sits at when nothing is happening."
            >
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="bucket" tick={AXIS_TICK} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="organic" stackId="s" fill="#38bdf8" name="Organic" />
                  <Bar dataKey="referral" stackId="s" fill="#a78bfa" name="Referral link" />
                  <Bar dataKey="seed" stackId="s" fill="#64748b" name="Paid / campaign" />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="Organic baseline"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="K-factor over time (D7, mature cohorts only)"
              description="One line per component, plotted at a single maturity day. Mixing maturity days on one axis would draw the passage of time as a trend — an older cohort scores higher simply by having lived longer."
              legend="Only cohorts whose D7 window has closed appear. A short line means the range is mostly younger than 7 days, not that virality stopped."
            >
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={kSeries}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="cohortDate" tick={AXIS_TICK} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="kTotal"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={false}
                    name="K total"
                  />
                  <Line
                    type="monotone"
                    dataKey="kDirect"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                    name="K direct"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ── Share funnel ─────────────────────────────────────────── */}
          <div className="mt-4">
            <ChartCard
              title="Share funnel"
              description="K = i × c decomposed. A falling K tells you nothing on its own; this says whether people stopped sharing, stopped being clicked, or stopped converting — three different problems with three different fixes."
              legend={
                summary.shareFunnel === null
                  ? "No mature cohort in this range yet."
                  : "A step reading '—' means its denominator is incomplete, not that the rate is zero — the funnel events table is younger than the referral programme."
              }
            >
              {summary.shareFunnel && (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <FunnelStep
                    label="Shared at all"
                    value={pct(summary.shareFunnel.shareRate)}
                    sub={`${summary.shareFunnel.sharers} of ${summary.shareFunnel.cohortSize}`}
                  />
                  <FunnelStep
                    label="Invites per user (i)"
                    value={num(summary.shareFunnel.invitesPerUser, 2)}
                    sub={`${summary.shareFunnel.invitesSent} sent`}
                  />
                  <FunnelStep
                    label="Click-through"
                    value={pct(summary.shareFunnel.clickRate)}
                    sub={`${summary.shareFunnel.linkClicks} clicks`}
                  />
                  <FunnelStep
                    label="Click → activation (c)"
                    value={pct(summary.shareFunnel.activationRate)}
                    sub={`${summary.shareFunnel.activations} activated`}
                  />
                </div>
              )}
            </ChartCard>
          </div>

          {/* ── Cohort maturity matrix ───────────────────────────────── */}
          <div className="mt-4">
            <ChartCard
              title="K-direct maturity matrix"
              description="One row per registration cohort, one column per day of maturity. Reading a row left to right shows how long that cohort keeps paying back; reading a column top to bottom compares cohorts fairly, because every cell in it has had the same amount of time."
              legend="Cells are K_direct, not blended K: word of mouth belongs to the acquisition day rather than to the cohort, so it is the same number in every column of a row and would fill a maturity matrix with a constant. Hover any cell for the blend. Dimmed values with a dot are windows that have not closed — a floor, not a result."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2 pr-4 font-medium">Cohort</th>
                      <th className="py-2 pr-4 text-right font-medium">Size</th>
                      {maturityDays.map((day) => (
                        <th key={day} className="py-2 pr-4 text-right font-medium">
                          D{day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(cohorts?.cohorts ?? []).map((row) => (
                      <tr key={row.cohortDate} className="border-t border-white/5">
                        <td className="py-1.5 pr-4 text-slate-300">{row.cohortDate}</td>
                        <td className="py-1.5 pr-4 text-right text-slate-500 tabular-nums">
                          {row.cohortSize}
                        </td>
                        {maturityDays.map((day) => (
                          <td
                            key={day}
                            className="py-1.5 pr-4 text-right tabular-nums"
                          >
                            <CohortCell cell={row.byMaturity[String(day)]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {(cohorts?.cohorts ?? []).length === 0 && (
                      <tr>
                        <td
                          colSpan={maturityDays.length + 2}
                          className="py-4 text-slate-600"
                        >
                          No cohorts in this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>

          {/* ── Clusters ─────────────────────────────────────────────── */}
          <div className="mt-4">
            <ChartCard
              title="Virality by cluster (D7)"
              description="Word of mouth is geographic. A spike in a campus where a paid cohort landed last week is that cohort's word of mouth; the same spike in a city we never touched is something else, and the two call for opposite responses. A global average cannot show either — two clusters moving in opposite directions cancel out in it."
              legend="Sorted by volume, not by K: a five-person cluster at K = 0.4 at the top of the list would be an invitation to mistake noise for a win."
            >
              <div className="mb-3 flex flex-wrap gap-2">
                {DIMENSIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDimension(d.value)}
                    className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium ${
                      dimension === d.value ? "btn-primary" : "btn"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2 pr-4 font-medium">Cluster</th>
                      <th className="py-2 pr-4 text-right font-medium">Signups</th>
                      <th className="py-2 pr-4 text-right font-medium">Organic</th>
                      <th className="py-2 pr-4 text-right font-medium">Uplift</th>
                      <th className="py-2 pr-4 text-right font-medium">K wom</th>
                      <th className="py-2 pr-4 text-right font-medium">K direct</th>
                      <th className="py-2 pr-4 text-right font-medium">K total</th>
                      <th className="py-2 pr-4 text-right font-medium">Cycle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(clusters?.clusters ?? []).map((row) => (
                      <tr key={row.scope} className="border-t border-white/5">
                        <td className="py-1.5 pr-4 text-slate-300">{row.key ?? row.scope}</td>
                        <td className="py-1.5 pr-4 text-right text-slate-400 tabular-nums">
                          {row.signups}
                        </td>
                        <td className="py-1.5 pr-4 text-right text-slate-400 tabular-nums">
                          {row.organicSignups}
                        </td>
                        <td className="py-1.5 pr-4 text-right text-slate-400 tabular-nums">
                          {num(row.organicUplift, 1)}
                        </td>
                        <td className="py-1.5 pr-4 text-right tabular-nums text-slate-300">
                          {num(row.kWom)}
                        </td>
                        <td className="py-1.5 pr-4 text-right tabular-nums text-slate-300">
                          {num(row.kDirect)}
                        </td>
                        <td
                          className={`py-1.5 pr-4 text-right font-semibold tabular-nums ${kTone(row.kTotal)}`}
                        >
                          {num(row.kTotal)}
                        </td>
                        <td className="py-1.5 pr-4 text-right text-slate-400 tabular-nums">
                          {hours(row.cycleTimeMedianHours)}
                        </td>
                      </tr>
                    ))}
                    {(clusters?.clusters ?? []).length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-4 text-slate-600">
                          No cluster passed the minimum size in this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>

          {/* ── HDYHAU + anomalies ───────────────────────────────────── */}
          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            <ChartCard
              title="How did you hear about us"
              description="What people say brought them, next to what the attribution recorded. The interesting number is not the distribution — it is the share of untracked arrivals who say a person told them, because that is word of mouth measured directly instead of inferred from a curve."
              legend={
                summary.hdyhau.total === 0
                  ? "No answers yet — the onboarding question is behind HDYHAU_SURVEY_ENABLED, and K_wom falls back to the baseline method until it has coverage."
                  : `${summary.hdyhau.total} answers · ${pct(summary.hdyhau.womShareOfOrganic)} of untracked arrivals credit a person · survey coverage ${pct(summary.wom.calibration.coverage)}`
              }
            >
              {summary.hdyhau.total > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={summary.hdyhau.byAnswer} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={AXIS_TICK} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="answer"
                      tick={AXIS_TICK}
                      tickLine={false}
                      width={130}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#38bdf8" name="Answers" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Anomalies"
              description="Days where untracked organic left its own baseline by more than 2σ, and cohorts whose viral cycle time shifted by as much. Drops are reported alongside spikes: a collapse in organic is a broken link or a dead redirect, and learning about it from a weekly report is expensive."
              legend={
                anomalies
                  ? `${anomalies.count} found across ${anomalies.pointsChecked} day-points at ${anomalies.sigma}σ. A 2σ rule fires on roughly 5% of points by chance — compare the two numbers before reading meaning into a hit.`
                  : undefined
              }
            >
              <div className="max-h-64 overflow-y-auto">
                {(anomalies?.anomalies ?? []).map((a) => (
                  <div
                    key={`${a.kind}-${a.scope}-${a.at}`}
                    className="flex items-baseline justify-between gap-3 border-t border-white/5 py-1.5 text-xs first:border-t-0"
                  >
                    <span className="text-slate-300">
                      {a.at}
                      <span className="ml-2 text-slate-500">{a.scope}</span>
                    </span>
                    <span
                      className={
                        a.direction === "up" ? "text-emerald-300" : "text-rose-300"
                      }
                    >
                      {a.kind.replace(/_/g, " ")} · {a.observed} vs {a.expected.toFixed(1)}{" "}
                      <span className="text-slate-500">({a.zScore.toFixed(1)}σ)</span>
                    </span>
                  </div>
                ))}
                {(anomalies?.anomalies ?? []).length === 0 && (
                  <p className="py-4 text-xs text-slate-600">
                    Nothing outside the threshold in this range.
                  </p>
                )}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function FunnelStep({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md bg-slate-900/40 p-3">
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}
