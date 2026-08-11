import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type {
  ConversionSlice,
  MonetizationData,
  MonetizationSegmentRow,
} from "../lib/api";
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

/** Below this many people a percentage is arithmetic, not a finding. */
const LOW_SAMPLE = 20;

const KIND_LABEL: Record<string, string> = {
  tickets: "Ticket store",
  date_ticket: "Date ticket",
  premium: "Gennety Premium",
  rematch: "Rematch",
  venue_change: "Venue change",
};

const SEGMENT_TABS: Array<{
  key: keyof MonetizationData["segments"];
  label: string;
  description: string;
}> = [
  {
    key: "byChannel",
    label: "Acquisition channel",
    description:
      "Which channel brings people who actually pay. A channel with many signups and no payers is burning budget — this is the cut that says where to spend.",
  },
  {
    key: "byGender",
    label: "Gender",
    description:
      "Men pay by construction here: 'pay for us both' at the date gate is a male-only option, and paid Rematch is offered to men only. A female paying share near zero is the design, not a failure.",
  },
  {
    key: "byCity",
    label: "City",
    description:
      "Matching is same-city, so revenue is bounded by the pool in each market. Only Kyiv has launched, so this becomes informative at the second city.",
  },
  {
    key: "byTrack",
    label: "Registration track",
    description:
      "Students (university email) start with 2 free Date Tickets; the general track (phone) starts with none. Whether students ever convert to paying is the question this answers.",
  },
];

function usd(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function ratePct(pct: number | null): string {
  return pct == null ? "n/a" : `${pct.toFixed(1)}%`;
}

/** One of the three denominators, rendered as "x of y". */
function ConversionRow({ label, slice, hint }: { label: string; slice: ConversionSlice; hint: string }) {
  return (
    <div className="glass-card-borderless rounded-2xl px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <p className="text-lg font-black tracking-tight text-white">{ratePct(slice.pct)}</p>
      </div>
      <p className="mt-0.5 text-xs font-medium text-slate-400/80">
        {slice.payers} of {slice.base}
        {slice.base === 0 && " — nobody has reached this stage yet"}
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed font-medium text-rose-200/50">{hint}</p>
    </div>
  );
}

function SegmentTable({ rows }: { rows: MonetizationSegmentRow[] }) {
  if (rows.length === 0) {
    return <p className="text-xs font-medium text-slate-400/70">No users in this cut yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            <th className="pb-2 pr-4">Segment</th>
            <th className="pb-2 pr-4 text-right">Users</th>
            <th className="pb-2 pr-4 text-right">Payers</th>
            <th className="pb-2 pr-4 text-right">Paying %</th>
            <th className="pb-2 text-right">Revenue</th>
          </tr>
        </thead>
        <tbody className="font-medium text-slate-200">
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-white/5">
              <td className="py-2 pr-4 font-semibold text-white">{row.key}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{row.users}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{row.payers}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {ratePct(row.payingRatePct)}
                {row.users < LOW_SAMPLE && (
                  <span className="ml-1.5 text-[10px] text-slate-500">low n</span>
                )}
              </td>
              <td className="py-2 text-right tabular-nums">{usd(row.usdCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  data: MonetizationData;
}

export default function MonetizationSection({ data }: Props) {
  const { headline, revenue, byKind, cohorts, segments, repeat, timing } = data;

  const cohortChart = [...cohorts]
    .reverse()
    .map((c) => ({
      name: c.weekStart.slice(5),
      "Paying %": c.payingRatePct ?? 0,
      size: c.size,
      censored: c.censored,
    }));

  return (
    <section className="space-y-10">
      <SectionHeader
        title="Monetization"
        description="What share of the people we acquired actually pay. Test and synthetic accounts are excluded from every numerator, denominator and revenue figure — so the base here is smaller than the raw user count, and deliberately so."
      />

      {data.truncated && (
        <p className="rounded-2xl bg-amber-950/40 px-4 py-3 text-xs font-semibold text-amber-200">
          The purchase index hit its fetch ceiling — these figures are partial.
        </p>
      )}

      {/* Headline: the number the founder asked for. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <StatCard
          label="Paying users"
          value={ratePct(headline.payingRatePct)}
          sub={`${headline.payers} of ${headline.registeredReal} real registrations`}
          accent
          info="Share of everyone we acquired who has ever been charged real money. Free tickets (welcome gift, student bonus, referral, promo) are not purchases. A user whose every purchase was refunded is not counted."
          lowSample={headline.registeredReal < LOW_SAMPLE}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <ConversionRow
            label="Of activated"
            slice={headline.ofActivated}
            hint="Same payers, but divided only by people who finished onboarding and verified — removes the onboarding leak from the denominator."
          />
          <ConversionRow
            label="Of paywall reached"
            slice={headline.ofPaywallReached}
            hint="The true paywall conversion: divided only by people the product actually asked for money — the Date Ticket gate after a mutual accept."
          />
        </div>
      </div>

      {/* Revenue */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Revenue</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="All time"
            value={usd(revenue.allTimeUsdCents)}
            sub={`${revenue.stars.toLocaleString()} ⭐`}
            info="Refunded purchases are excluded — that money is not ours. A refund that FAILED is included, because the money is still with us; that state is an ops alarm, not a completed reversal."
          />
          <StatCard
            label="This week"
            value={usd(revenue.thisWeekUsdCents)}
            sub={
              revenue.growthPct == null
                ? `last week ${usd(revenue.lastWeekUsdCents)}`
                : `${revenue.growthPct > 0 ? "+" : ""}${revenue.growthPct}% vs last week`
            }
            info="Charges dated inside the last 7 days, not the lifetime spend of people who happened to buy this week."
          />
          <StatCard
            label="ARPU"
            value={usd(revenue.arpuUsdCents)}
            sub="per real user"
            info="All-time revenue divided by real registered users (test accounts excluded)."
          />
          <StatCard
            label="ARPPU"
            value={usd(revenue.arppuUsdCents)}
            sub="per paying user"
            info="All-time revenue divided by paying users. With ARPU it says whether the problem is 'few people pay' or 'people pay too little'."
          />
        </div>

        <div className="glass-card-borderless rounded-2xl px-4 py-3 text-[11px] leading-relaxed font-medium text-rose-200/60">
          Dollar figures from Telegram Stars are an <strong className="text-rose-200">estimate</strong> —
          Telegram publishes no Stars→USD rate, so they are converted at the documented $0.02/⭐ ticket
          rate. App Store rows carry Apple's real price.
          {revenue.excludedTestUsdCents > 0 && (
            <>
              {" "}
              A further <strong className="text-rose-200">{usd(revenue.excludedTestUsdCents)}</strong>{" "}
              went through test accounts and is excluded here — which is why this total is smaller than
              the Purchases ledger.
            </>
          )}
        </div>
      </div>

      {/* Products + repeat behaviour */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="What people actually buy"
          description="Distinct payers per product, not transaction count — one person buying three ticket bundles is one payer."
        >
          {byKind.length === 0 ? (
            <p className="text-xs font-medium text-slate-400/70">Nothing has been bought yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    <th className="pb-2 pr-4">Product</th>
                    <th className="pb-2 pr-4 text-right">Payers</th>
                    <th className="pb-2 pr-4 text-right">Purchases</th>
                    <th className="pb-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-slate-200">
                  {byKind.map((row) => (
                    <tr key={row.kind} className="border-t border-white/5">
                      <td className="py-2 pr-4 font-semibold text-white">
                        {KIND_LABEL[row.kind] ?? row.kind}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">{row.payers}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{row.purchases}</td>
                      <td className="py-2 text-right tabular-nums">{usd(row.usdCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Do they come back"
          description="A one-time payer is a transaction; a repeat payer is a business. This is the difference between the two."
        >
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Bought once" value={repeat.oncePayers} />
            <StatCard
              label="Bought again"
              value={repeat.repeatPayers}
              sub={repeat.repeatRatePct == null ? undefined : `${repeat.repeatRatePct}% of payers`}
            />
            <StatCard
              label="Purchases / payer"
              value={repeat.purchasesPerPayer ?? "—"}
              info="Average number of paid transactions per paying user."
            />
            <StatCard
              label="Days to first payment"
              value={timing.medianDaysToFirstPayment ?? "—"}
              sub={
                timing.p90DaysToFirstPayment == null
                  ? "median"
                  : `median · p90 ${timing.p90DaysToFirstPayment}`
              }
              info="From signup to the first charge. Growing = friction appeared somewhere on the way to the first paid moment."
            />
          </div>
          {data.refundedOnlyPayers > 0 && (
            <p className="mt-3 text-[11px] font-medium text-amber-200/80">
              {data.refundedOnlyPayers} user{data.refundedOnlyPayers > 1 ? "s" : ""} paid and had
              everything refunded — not counted as paying, but they did try.
            </p>
          )}
        </ChartCard>
      </div>

      {/* Cohorts */}
      <ChartCard
        title="Paying share by signup week"
        description={`Each bar is a registration week. The newest cohorts are marked "not mature yet" — they have had fewer than ${data.cohortMaturityDays} days to decide, so a low bar there is absence of data, not a result.`}
      >
        {cohortChart.length === 0 ? (
          <p className="text-xs font-medium text-slate-400/70">No cohorts yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cohortChart}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  // The cohort SIZE rides in the tooltip label rather than the
                  // value: "40%" of a 5-person week is two people, and a bar
                  // read without its n is the single easiest way to
                  // misread this chart.
                  labelFormatter={(label) => {
                    const row = cohortChart.find((c) => c.name === label);
                    if (!row) return String(label);
                    return `Week of ${row.name} · ${row.size} signup${row.size === 1 ? "" : "s"}${
                      row.censored ? " · not mature yet" : ""
                    }`;
                  }}
                />
                <Legend />
                <Bar dataKey="Paying %" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {cohortChart.some((c) => c.censored) && (
              <p className="mt-2 text-[11px] font-medium text-slate-400/70">
                Not mature yet:{" "}
                {cohortChart
                  .filter((c) => c.censored)
                  .map((c) => c.name)
                  .join(", ")}
              </p>
            )}
          </>
        )}
      </ChartCard>

      {/* Segments */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-white">Who pays</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          {SEGMENT_TABS.map((tab) => (
            <ChartCard key={tab.key} title={tab.label} description={tab.description}>
              <SegmentTable rows={segments[tab.key]} />
            </ChartCard>
          ))}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed font-medium text-slate-400/70">
        {data.excludedTestUsers} test / synthetic account
        {data.excludedTestUsers === 1 ? " is" : "s are"} excluded from every figure on this tab. That
        classification is computed on the server (Account health) — the same one the onboarding funnel
        divides by, so the two tabs can never disagree about how many real users exist.
      </p>
    </section>
  );
}
