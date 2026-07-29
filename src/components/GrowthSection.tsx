import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { RetentionData, DatesData, VerificationData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";
import ChartCard from "./charts/ChartCard";

const TOOLTIP_STYLE = {
  backgroundColor: "#17181c",
  border: "none",
  borderRadius: 12,
  color: "#ffffff",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
};

const STATUS_COLORS: Record<string, string> = {
  onboarding: "#f59e0b",
  active: "#e11d48",
  paused: "#64748b",
  suspended: "#ef4444",
  banned: "#7f1d1d",
  pending_investigation: "#a855f7",
};

interface Props {
  retention: RetentionData;
  dates: DatesData;
  verification: VerificationData;
}

export default function GrowthSection({ retention, dates, verification }: Props) {
  return (
    <section className="space-y-12">
      <SectionHeader
        title="Growth & trust"
        description="Long-horizon health: do users stick around, do dates actually happen, and is the verification pipeline catching abuse without false positives."
      />

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Avg matches / user"
          value={retention.avgMatchesPerUser.toFixed(2)}
          info="Total per-side decisions (ACCEPTED + DECLINED) divided by total registered users. Includes onboarding/inactive in the denominator on purpose — that's the realistic per-user yield."
        />
        <StatCard
          label="Date completion rate"
          value={`${(dates.completionRate * 100).toFixed(1)}%`}
          accent
          info="completed / (scheduled + completed). Cancelled matches are tracked separately so the metric isn't deflated by mid-flow drop-offs that never reached `scheduled`."
          lowSample={dates.scheduledCount + dates.completedCount < 10}
        />
        <StatCard
          label="Verified users"
          value={verification.funnel.verified?.toLocaleString() ?? "0"}
          sub={
            verification.totalUsers > 0
              ? `${(((verification.funnel.verified ?? 0) / verification.totalUsers) * 100).toFixed(1)}% of base`
              : undefined
          }
          info="Users who completed Persona liveness AND passed the face-match threshold. Only verified users avoid the unverified-Elo penalty."
        />
        <StatCard
          label="Verification skip rate"
          value={`${(verification.skipRate * 100).toFixed(1)}%`}
          info="Share of users who tapped 'Skip' on the verification CTA at end of onboarding. High skip rate is a UX problem; these users carry the unverified Elo penalty until they verify."
        />
      </div>

      {/* ── Retention block ────────────────────────────────────────── */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-white">Retention</h3>

        <ChartCard
          title="Cohort retention (week of registration → activity at W+N)"
          description="Each row is a registration week cohort. Cells show the share of that cohort still active (sent a message or made a match decision) N weeks later. '—' = cohort isn't old enough yet to have a measurable W+N value. 'low N' flags small cohorts."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400 uppercase">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pr-4 text-left">Cohort</th>
                  <th className="py-2 pr-4 text-right">N</th>
                  <th className="py-2 pr-4 text-right">W+1</th>
                  <th className="py-2 pr-4 text-right">W+2</th>
                  <th className="py-2 pr-4 text-right">W+4</th>
                  <th className="py-2 pr-4 text-right">W+8</th>
                </tr>
              </thead>
              <tbody>
                {retention.cohorts
                  .slice(-12)
                  .reverse()
                  .map((c) => {
                    const lowN = c.size < 10;
                    return (
                      <tr key={c.cohort} className="border-b border-slate-800/40 text-slate-300">
                        <td className="py-2 pr-4 font-mono">{c.cohort}</td>
                        <td className="py-2 pr-4 text-right">
                          {c.size}
                          {lowN && (
                            <span className="ml-1 text-[10px] text-amber-400/80">low N</span>
                          )}
                        </td>
                        {[1, 2, 4, 8].map((offset) => {
                          const v = c.retained[String(offset)];
                          return (
                            <td key={offset} className="py-2 pr-4 text-right">
                              {v === null || v === undefined ? (
                                <span className="text-slate-600">—</span>
                              ) : (
                                <span style={{ color: pctColor(v) }}>
                                  {(v * 100).toFixed(0)}%
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="Status breakdown"
            description="Where every user currently sits. paused/suspended/banned all have specific causes; rising suspended/banned counts mean Tier 2/3 reports are firing more."
          >
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={Object.entries(retention.statusBreakdown).map(([k, v]) => ({
                    name: k,
                    value: v,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {Object.keys(retention.statusBreakdown).map((k) => (
                    <Cell key={k} fill={STATUS_COLORS[k] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Re-engagement chain progress"
            description="Step in the drop-off re-engagement DM chain. 0 = chain idle (engaged or completed). 1-4 = touches delivered. 5 = chain exhausted, user didn't return — these are effectively churned."
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={[0, 1, 2, 3, 4, 5].map((i) => ({
                  step: `Step ${i}`,
                  count: retention.reEngagementFunnel[String(i)] ?? 0,
                }))}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <XAxis dataKey="step" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard
          title="Weekly registrations"
          description="Total new accounts per ISO week. Combine with the gender breakdown chart for balance trend."
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={retention.weeklyRegistrations}
              margin={{ top: 8, right: 16, left: 0, bottom: 24 }}
            >
              <XAxis
                dataKey="week"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="Platform split & active rate"
            description="Telegram-only, mobile-only, and `both` users with their respective active rates. Lower active rate on a platform suggests retention work there pays off most."
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={retention.platformSplit}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <XAxis dataKey="platform" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#475569" radius={[6, 6, 0, 0]} />
                <Bar dataKey="active" name="Active" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Top referral sources"
            description={`Captured once on first /start (Telegram deep-link param) — never overwritten on re-onboarding. ${retention.referralUnknown.toLocaleString()} users have no source attached (organic / pre-feature).`}
          >
            {retention.topReferralSources.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No referral sources captured yet. Share deep-links like
                <code className="mx-1 rounded bg-slate-800 px-1 py-0.5">?start=ig_story</code>
                to start collecting attribution.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, retention.topReferralSources.length * 22)}>
                <BarChart
                  data={retention.topReferralSources}
                  layout="vertical"
                  margin={{ left: 100, right: 16, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="source"
                    type="category"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={95}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#e11d48" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Date quality block ─────────────────────────────────────── */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-white">Date quality</h3>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Scheduled dates"
            value={dates.scheduledCount.toLocaleString()}
            info="Match rows that reached `scheduled` (venue + time confirmed)."
          />
          <StatCard
            label="Completed dates"
            value={dates.completedCount.toLocaleString()}
            info="Status flipped to `completed` post-event (24h after agreedTime)."
          />
          <StatCard
            label="Match → date (median)"
            value={
              dates.matchToDate.median !== null
                ? `${dates.matchToDate.median.toFixed(1)}d`
                : "—"
            }
            sub={
              dates.matchToDate.p25 !== null
                ? `p25 ${dates.matchToDate.p25.toFixed(1)} – p75 ${dates.matchToDate.p75?.toFixed(1) ?? "—"}d`
                : undefined
            }
            info="Time between match creation and the agreed date. Long values mean scheduling negotiation drags — consider pushing iteration 3 (calendar) earlier."
            lowSample={dates.matchToDate.n < 10}
          />
          <StatCard
            label="Chemistry ratio"
            value={
              dates.chemistry.ratio !== null
                ? `${(dates.chemistry.ratio * 100).toFixed(0)}%`
                : "—"
            }
            sub={`${dates.chemistry.positive} positive · ${dates.chemistry.negative} negative`}
            info="Share of CHEMISTRY_POSITIVE among (POSITIVE + NEGATIVE) MatchEvents fired post-date. The headline 'are dates working?' metric."
            accent
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="Feedback sentiment"
            description="Coarse 3-bucket classification of post-date feedback text using keyword scan (positive/negative/neutral keywords). For quick directional signal — not a precision NLP measurement."
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={dates.feedbackSentiment}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <XAxis dataKey="sentiment" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {dates.feedbackSentiment.map((entry) => {
                    const color =
                      entry.sentiment === "positive"
                        ? "#10b981"
                        : entry.sentiment === "negative"
                          ? "#ef4444"
                          : entry.sentiment === "neutral"
                            ? "#f59e0b"
                            : "#64748b";
                    return <Cell key={entry.sentiment} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Silent-ignore distribution"
            description="Per-user count of times they let a 24h match proposal expire without responding. The first ignore is a warning; from the second onwards it Elo-decays them like a decline. Long right-tail = ghosting problem."
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={dates.silentIgnoreHistogram}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* ── Verification block ─────────────────────────────────────── */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-white">Verification & trust</h3>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="Verification funnel"
            description="Pipeline state of every user: unverified → pending → pending_review (auto-detected ambiguous match) → verified or rejected. A rising pending_review queue means the face-match threshold needs tuning or admin review is lagging."
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={Object.entries(verification.funnel).map(([k, v]) => ({
                  name: k,
                  count: v,
                }))}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="faceMatchScore distribution"
            description="Persona's lowest per-photo face-match similarity (0..1) against the verified selfie. Below the verify threshold → pending_review. Bimodal shape = a clear high cluster (real users) and low cluster (mismatches/abuse)."
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={verification.faceMatchScoreHistogram}
                margin={{ top: 4, right: 16, left: 0, bottom: 24 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#475569", fontSize: 9 }}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard
          title="Reports trend by tier"
          description="Tier 1 = preference complaint, Tier 2 = ethical, Tier 3 = safety (Tier 3 unreviewed get a top-of-page alert). Watch for tier-3 spikes — they often map to abuse waves."
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={verification.reportsWeekly}
              margin={{ top: 8, right: 16, left: 0, bottom: 24 }}
            >
              <XAxis
                dataKey="week"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Line type="monotone" dataKey="tier1" name="Tier 1" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tier2" name="Tier 2" stroke="#fb923c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tier3" name="Tier 3" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="Stuck pending_review"
            description={`Users in pending_review state for more than ${verification.stuckThresholdDays} days. They're blocked from full participation; admin needs to clear or reject.`}
          >
            {verification.stuckPendingReview.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Queue is clean — no users stuck in pending_review.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-400 uppercase">
                    <tr className="border-b border-slate-800">
                      <th className="py-2 pr-4 text-left">Name</th>
                      <th className="py-2 pr-4 text-right">Score</th>
                      <th className="py-2 pr-4 text-right">Days stuck</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verification.stuckPendingReview.slice(0, 15).map((u) => (
                      <tr key={u.id} className="border-b border-slate-800/40 text-slate-300">
                        <td className="py-2 pr-4">{u.firstName ?? "—"}</td>
                        <td className="py-2 pr-4 text-right">
                          {u.faceMatchScore !== null ? u.faceMatchScore.toFixed(2) : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right">{u.daysStuck}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Report processing & false-positive proxy"
            description="Median days from report submission to admin review (we don't store reviewedAt yet — proxy uses createdAt to now). False-positive proxy = reports admin reviewed but where the reported user was NOT suspended/banned. Imperfect but flags over-eager Tier triage."
          >
            <div className="grid grid-cols-1 gap-3">
              {(["tier1", "tier2", "tier3"] as const).map((tier) => {
                const t = verification.processingTime[tier];
                return (
                  <div
                    key={tier}
                    className="rounded-2xl bg-[#17181c] p-3 text-sm [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs tracking-wide text-slate-400 uppercase">
                        {tier}
                      </span>
                      <span className="text-xs text-slate-500">n={t.n}</span>
                    </div>
                    <span className="text-slate-300">
                      median {t.median !== null ? t.median.toFixed(1) : "—"}d
                    </span>
                  </div>
                );
              })}
              <div className="rounded-lg border border-amber-700/40 bg-amber-500/5 p-3 text-sm">
                <p className="text-xs tracking-wide text-amber-400 uppercase">
                  False-positive proxy
                </p>
                <p className="mt-1 text-slate-300">
                  {verification.falsePositiveProxy.toLocaleString()} reviewed reports without
                  a suspend/ban
                  {verification.falsePositiveRate !== null && (
                    <>
                      {" "}
                      —{" "}
                      <span className="font-semibold text-white">
                        {(verification.falsePositiveRate * 100).toFixed(0)}%
                      </span>{" "}
                      of reviewed
                    </>
                  )}
                </p>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

function pctColor(v: number): string {
  if (v >= 0.6) return "#10b981";
  if (v >= 0.3) return "#f59e0b";
  return "#ef4444";
}
