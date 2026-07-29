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
} from "recharts";
import type { GenderData } from "../lib/api";
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

interface Props {
  data: GenderData;
}

export default function GenderSection({ data }: Props) {
  const totalMale = data.weeklyRegistrations.reduce((a, w) => a + w.male, 0);
  const totalFemale = data.weeklyRegistrations.reduce((a, w) => a + w.female, 0);
  const ratio =
    totalFemale > 0 ? +(totalMale / totalFemale).toFixed(2) : null;

  const funnelChartData = (["male", "female"] as const).map((g) => ({
    name: g === "male" ? "Male" : "Female",
    Onboarding: data.funnel[g].onboarding,
    Active: data.funnel[g].active,
    "Got match": data.funnel[g].gotMatch,
  }));

  return (
    <section className="space-y-8">
      <SectionHeader
        title="Gender balance"
        description="Drives matchability — if either side runs short, half the user base waits in vain. Use these to target growth campaigns at underrepresented universities."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="M : F ratio"
          value={ratio !== null ? `${ratio} : 1` : "—"}
          accent
          info="Cumulative male-to-female ratio across all registered users. Closer to 1.0 = better matchability. >1.5 means males will increasingly compete for fewer female matches."
        />
        <StatCard
          label="Stale active (♂)"
          value={data.staleActive.male.toLocaleString()}
          sub={`>${data.staleActiveThresholdDays}d without a match`}
          info={`Active male users who registered more than ${data.staleActiveThresholdDays} days ago and have never been part of a match. These are at high churn risk.`}
        />
        <StatCard
          label="Stale active (♀)"
          value={data.staleActive.female.toLocaleString()}
          sub={`>${data.staleActiveThresholdDays}d without a match`}
          info="Same metric for female users. Disparity between male and female stale counts is the canonical 'we have a balance problem' signal."
        />
        <StatCard
          label="Skewed universities"
          value={data.skewedUniversities.length.toLocaleString()}
          sub="≥10 users, ≥70% one gender"
          info="Universities with >70% of one gender (and at least 10 users). These need targeted outreach to the under-represented side or matches will starve."
        />
      </div>

      {/* Weekly registration line */}
      <ChartCard
        title="Weekly registrations by gender"
        description="New user signups per ISO week. A widening gap = balance is degrading; the matcher will increasingly leave the over-represented side without matches."
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.weeklyRegistrations} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
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
            <Line type="monotone" dataKey="male" name="Male" stroke="#e11d48" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="female" name="Female" stroke="#fb7185" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="unknown" name="Unknown" stroke="#64748b" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Funnel by gender */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Conversion funnel by gender"
          description="Each bar shows where users of that gender are right now in the lifecycle: onboarding → active → got at least one match. A sharp drop-off on one side indicates an onboarding or matching bottleneck."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="Onboarding" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Active" fill="#be123c" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Got match" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Wait time to first decision (days)"
          description="Days from registration to a user's first accept/decline. Median is more honest than mean for skewed wait distributions. The 'censored' counter shows active users still waiting — survivorship bias would otherwise hide them."
        >
          <div className="grid grid-cols-1 gap-3 text-sm">
            {(["male", "female", "unknown"] as const).map((g) => {
              const w = data.waitTime[g];
              const lowSample = w.n < 10;
              return (
                <div
                  key={g}
                  className="rounded-2xl bg-[#17181c] p-4 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs tracking-wide text-slate-400 uppercase">
                      {g}
                    </span>
                    <span className="text-xs text-slate-500">
                      n={w.n} · censored={w.censored}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <span className="text-slate-500">median</span>{" "}
                      <span className="font-semibold text-white">
                        {w.median !== null ? w.median.toFixed(1) : "—"}d
                      </span>
                    </span>
                    <span>
                      <span className="text-slate-500">p25–p75</span>{" "}
                      <span className="text-slate-300">
                        {w.p25 !== null ? w.p25.toFixed(1) : "—"}–
                        {w.p75 !== null ? w.p75.toFixed(1) : "—"}d
                      </span>
                    </span>
                  </div>
                  {lowSample && (
                    <p className="mt-1 text-[10px] tracking-wide text-amber-400/80 uppercase">
                      low sample
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Preference matrix */}
      <ChartCard
        title="Preference effectiveness"
        description="Who is each cohort actually looking for? E.g. how many male users selected `women` vs `men` vs `both`. Mismatch with gender balance shows where pool depletion happens (e.g. lots of M searching for F, but F count is low)."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={(["male", "female", "unknown"] as const).map((g) => ({
              name: g,
              men: data.preferenceMatrix[g].men,
              women: data.preferenceMatrix[g].women,
              both: data.preferenceMatrix[g].both,
              unknown: data.preferenceMatrix[g].unknown,
            }))}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Bar dataKey="men" stackId="a" fill="#be123c" />
            <Bar dataKey="women" stackId="a" fill="#f43f5e" />
            <Bar dataKey="both" stackId="a" fill="#9f1239" />
            <Bar dataKey="unknown" stackId="a" fill="#475569" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Skewed universities table */}
      <ChartCard
        title="Skewed universities"
        description="Universities where one gender exceeds 70% of the user base (with ≥10 total users). These are where targeted recruitment has the biggest impact. Action: run growth campaigns to the under-represented side."
      >
        {data.skewedUniversities.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No skewed universities yet — balance is healthy.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pr-4 text-left">Domain</th>
                  <th className="py-2 pr-4 text-right">Male</th>
                  <th className="py-2 pr-4 text-right">Female</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 pr-4 text-right">Skew</th>
                </tr>
              </thead>
              <tbody>
                {data.skewedUniversities.slice(0, 20).map((u) => (
                  <tr key={u.domain} className="border-b border-slate-800/40 text-slate-300">
                    <td className="py-2 pr-4 font-mono text-xs">{u.domain}</td>
                    <td className="py-2 pr-4 text-right">{u.male}</td>
                    <td className="py-2 pr-4 text-right">{u.female}</td>
                    <td className="py-2 pr-4 text-right">{u.total}</td>
                    <td className="py-2 pr-4 text-right">
                      <span
                        className={
                          u.malePct >= 0.7
                            ? "rounded bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300"
                            : "rounded bg-pink-500/15 px-2 py-0.5 text-xs text-pink-300"
                        }
                      >
                        {(u.malePct * 100).toFixed(0)}% male
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </section>
  );
}
