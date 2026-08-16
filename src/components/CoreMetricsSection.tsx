import type { AdminDashboardData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";

/**
 * The daily Core-metrics block, plus the net Match → Date Ticket conversion.
 *
 * One rule runs through every card here and is worth stating once: a `null`
 * from the API means "we do not know", and it is rendered as "no data" with
 * the reason beside it — never as 0. Zero is a measurement; absence is not,
 * and only the first is an argument for changing the product. Printing 0%
 * for an empty denominator is the single mistake that would make this block
 * worse than not having it.
 */

/** Below this many matches a percentage is arithmetic, not a finding. */
const LOW_SAMPLE = 20;

const NO_DATA = "no data";

function pctText(v: number | null | undefined): string {
  return v == null ? NO_DATA : `${v.toFixed(1)}%`;
}

function usd(cents: number | null | undefined): string {
  return cents == null ? NO_DATA : `$${(cents / 100).toFixed(2)}`;
}

/**
 * A metric that is blocked on a mechanism nobody has built yet.
 *
 * It still reads the field. That matters: `cacPerPayingUsdCents` and `ltvCac`
 * are real fields the API already returns, they are simply always `null`
 * today — so a card that hard-coded "no data" would keep saying it on the
 * day ad spend starts arriving, and nobody would notice the number was
 * finally there. `value` absent ⇒ show the reason; `value` present ⇒ show
 * the number and drop the excuse.
 */
function BlockedCard({
  label,
  value,
  reason,
}: {
  label: string;
  value?: string | null;
  reason: string;
}) {
  const has = value != null;
  return (
    <div className="glass-card-borderless rounded-3xl p-5.5">
      <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
        {label}
      </p>
      <p
        className={`mt-2.5 text-2xl font-black tracking-tight ${
          has ? "text-white" : "text-slate-500"
        }`}
      >
        {has ? value : NO_DATA}
      </p>
      {!has && (
        <p className="mt-1.5 text-xs leading-relaxed font-medium text-slate-400/70">
          {reason}
        </p>
      )}
    </div>
  );
}

/** One step of the conversion funnel, as "n" plus what it means. */
function FunnelStep({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "plain" | "accent" | "negative";
}) {
  const valueClass =
    tone === "accent"
      ? "text-gradient-cherry"
      : tone === "negative"
        ? "text-rose-300"
        : "text-white";
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed font-medium text-slate-400/80">
          {hint}
        </p>
      </div>
      <p className={`shrink-0 text-xl font-black tracking-tight ${valueClass}`}>
        {tone === "negative" && value > 0 ? `−${value}` : value}
      </p>
    </div>
  );
}

export default function CoreMetricsSection({
  data,
}: {
  data: AdminDashboardData;
}) {
  const d = data.derived;
  const c = data.conversion;
  const g = data.genderRatio;

  const lowSample = c.confirmed > 0 && c.confirmed < LOW_SAMPLE;
  const excluded = c.excludedSynthetic + c.excludedTest;

  return (
    <div className="space-y-10">
      {/* ── Daily ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Core metrics"
          description="The four numbers worth reading every day. Everything here excludes synthetic and test accounts — so none of these denominators is users.total."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            accent
            label="Weekly paid dates"
            value={d.weeklyPaidDates}
            sub="North Star — dates whose second ticket settled in the last 7 days"
            info="Counted by MATCH, not by payer: a man paying for both is one date and one payer, not two. The sale is dated when the SECOND slot closed, because §3.5b holds the calendar until both are paid."
          />
          <StatCard
            label="Match → paid ticket"
            value={pctText(d.matchToTicketConversionPct)}
            sub={
              d.matchToTicketConversionPct == null
                ? "no confirmed matches between real pairs yet"
                : `${pctText(d.matchToTicketGrossPct)} before deductions`
            }
            lowSample={lowSample}
            info="Net of no-shows, ghosting and refunds. Deductions are the UNION of those three intersected with paid matches, never their sum — a no-show is usually also a refund."
          />
          <StatCard
            label="Registered → match, 7d"
            value={pctText(d.registeredToMatchRate7dPct)}
            sub={`${d.matchedLast7Days} of ${d.registeredReal7d} real registrations`}
            info="Named for what it measures. Installs are tracked nowhere — iOS has not shipped, and the acquisition channel is recorded at registration — so this is not 'install → match'."
          />
          <BlockedCard
            label="CAC per paying"
            value={d.cacPerPayingUsdCents == null ? null : usd(d.cacPerPayingUsdCents)}
            reason="Ad spend cannot be entered anywhere yet. Design in AD_SPEND_TRACKING_DESIGN.md; nothing is implemented, so this stays blank rather than showing $0."
          />
        </div>
      </section>

      {/* ── Gender balance ────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Gender ratio"
          description="Matching is strictly two-sided, so pairs per drop are bounded by the smaller side. The unknown share is part of the finding, not a footnote."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Among those who answered"
            value={
              g.malePctOfKnown == null
                ? NO_DATA
                : `${g.male} M · ${g.female} F`
            }
            sub={
              g.malePctOfKnown == null
                ? "nobody has reached the gender question yet"
                : `${pctText(g.malePctOfKnown)} men of ${g.male + g.female} known`
            }
          />
          <StatCard
            label="Gender not stated"
            value={g.unknown}
            sub={
              g.unknownPctOfTotal == null
                ? "no real accounts"
                : `${pctText(g.unknownPctOfTotal)} of ${g.total} — they abandoned onboarding before the question`
            }
            info="Gender is asked on one of the first onboarding screens. Quoting the male share without this number describes a fraction of the base as the whole base."
          />
          <StatCard
            label="Real accounts"
            value={g.total}
            sub="test and synthetic accounts already removed"
          />
        </div>
      </section>

      {/* ── Match → Ticket, broken out ────────────────────────── */}
      <section>
        <SectionHeader
          title="Match → ticket, step by step"
          description="Where confirmed pairs stop. Every row is derived from columns the product already writes, so this covers the entire match history — not just since the metric shipped."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="glass-card-borderless rounded-3xl p-6 lg:col-span-2">
            <FunnelStep
              label="Confirmed matches"
              value={c.confirmed}
              hint="Both sides said yes. The denominator."
              tone="accent"
            />
            <FunnelStep
              label="Both tickets paid"
              value={c.ticketsPurchased}
              hint="The calendar opens only when both slots settle, so one ticket is not half a sale."
            />
            <FunnelStep
              label="One ticket of two"
              value={c.ticketsPartial}
              hint="Waiting on the other side. Not a date, and not counted either way."
            />
            <FunnelStep
              label="No-show"
              value={c.noShow}
              hint="Someone was left waiting. Answered at T+24h — silence reads as unknown, never as a no-show."
              tone="negative"
            />
            <FunnelStep
              label="Ghosted during planning"
              value={c.ghostDuringScheduling}
              hint="Went quiet between accepting and the date being locked in."
              tone="negative"
            />
            <FunnelStep
              label="Refunded"
              value={c.refunded}
              hint="A ticket returned to a wallet. Usually the same match as a row above — which is why they are not added up."
              tone="negative"
            />
            <FunnelStep
              label="Deductions applied"
              value={c.deductions}
              hint="Union of the three rows above, intersected with paid matches. Each ruined date subtracts once."
              tone="negative"
            />
          </div>

          <div className="space-y-4">
            <StatCard
              accent
              label="Net conversion"
              value={pctText(c.netPct)}
              sub={
                c.netPct == null
                  ? "empty denominator — nothing to divide"
                  : `(${c.ticketsPurchased} − ${c.deductions}) of ${c.confirmed}`
              }
              lowSample={lowSample}
            />
            <StatCard
              label="No-shows of sold tickets"
              value={pctText(c.noShowRateOfPaidPct)}
              sub="quality of what we actually sold"
            />
            <StatCard
              label="Ghosting of sold tickets"
              value={pctText(c.ghostRateOfPaidPct)}
              sub="planning that died after payment"
            />
          </div>
        </div>

        {excluded > 0 && (
          <p className="mt-4 text-[11px] leading-relaxed font-medium text-slate-400/70">
            Excluded from every number above:{" "}
            <span className="font-bold text-slate-300">{c.excludedSynthetic}</span>{" "}
            synthetic {c.excludedSynthetic === 1 ? "match" : "matches"} (the
            stand-in partner declines by construction and cannot buy a ticket)
            and{" "}
            <span className="font-bold text-slate-300">{c.excludedTest}</span>{" "}
            test {c.excludedTest === 1 ? "pair" : "pairs"}. Leaving them in
            would make the conversion a permanent zero by design rather than by
            fact.
          </p>
        )}
      </section>

      {/* ── Weekly ────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Weekly"
          description="Three numbers that need something the product does not have yet. They are listed so the gap is visible, not so the panel looks full."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BlockedCard
            label="LTV : CAC"
            value={d.ltvCac == null ? null : `${d.ltvCac.toFixed(2)}×`}
            reason="Needs acquisition cost. No ad-spend entry exists, so the ratio has no denominator — see the CAC card above."
          />
          <BlockedCard
            label="Churn"
            reason="Measured on Premium subscriptions. Not one has ever been sold, so there is no cohort to lose."
          />
          <BlockedCard
            label="MRR"
            reason="Same: recurring revenue starts at the first subscriber. Total revenue to date is on the Monetization tab."
          />
        </div>
      </section>
    </div>
  );
}
