import type { ReactNode } from "react";
import {
  getAdminDashboard,
  getAlgorithm,
  getAudience,
  getCities,
  getDates,
  getDemographics,
  getGenderAnalytics,
  getHeatmap,
  getMatches,
  getMonetization,
  getReportsStats,
  getRetention,
  getVerification,
  getWaitlist,
} from "../../lib/api";
import { GROWTH_SUBS, type GrowthSub } from "../../lib/analytics-tabs";
import { useLoad, type LoadState } from "../../lib/useLoad";
import AlgorithmSection from "../AlgorithmSection";
import AudienceSection from "../AudienceSection";
import CitiesSection from "../CitiesSection";
import CoreMetricsSection from "../CoreMetricsSection";
import DemographicsSection from "../DemographicsSection";
import GenderSection from "../GenderSection";
import GrowthSection from "../GrowthSection";
import MatchesSection from "../MatchesSection";
import MonetizationSection from "../MonetizationSection";
import ReportsSection from "../ReportsSection";
import ViralitySection from "../virality/ViralitySection";
import WaitlistSection from "../WaitlistSection";
import WeeklyMatchesSection from "../WeeklyMatchesSection";
import ActivityBlock from "./ActivityBlock";
import BotOnboardingBlock from "./BotOnboardingBlock";
import FunnelsBlock from "./FunnelsBlock";
import { Empty, InlineError, Loading } from "./ui";

/** Render one request's slot: spinner, inline error, or the section. */
function Slot<T>({ s, children }: { s: LoadState<T>; children: (data: T) => ReactNode }) {
  if (s.loading) return <Loading />;
  if (s.error || s.data == null) return <InlineError message={s.error ?? "пустой ответ"} />;
  return <>{children(s.data)}</>;
}

function Funnels({ t }: { t: number }) {
  return (
    <div className="space-y-8">
      <FunnelsBlock reloadToken={t} />
      <ActivityBlock reloadToken={t} />
      <BotOnboardingBlock reloadToken={t} />
    </div>
  );
}

function Core({ t }: { t: number }) {
  const s = useLoad(`core:${t}`, () => getAdminDashboard());
  return (
    <Slot s={s}>
      {(d) =>
        d.conversion && d.genderRatio ? (
          <CoreMetricsSection data={d} />
        ) : (
          // An older API answers /admin/dashboard without these blocks.
          <Empty title="Ключевые метрики появятся после обновления бэкенда" />
        )
      }
    </Slot>
  );
}

function Retention({ t }: { t: number }) {
  const f = t > 0;
  const retention = useLoad(`retention:${t}`, () => getRetention(f));
  const dates = useLoad(`dates:${t}`, () => getDates(f));
  const verification = useLoad(`verification:${t}`, () => getVerification(f));
  const reports = useLoad(`reports:${t}`, () => getReportsStats());
  const parts = [retention, dates, verification];
  const failed = parts.find((p) => p.error);
  return (
    <div className="space-y-8">
      {parts.some((p) => p.loading) ? (
        <Loading />
      ) : failed ? (
        <InlineError message={failed.error!} />
      ) : (
        <GrowthSection retention={retention.data!} dates={dates.data!} verification={verification.data!} />
      )}
      <Slot s={reports}>{(d) => <ReportsSection data={d} />}</Slot>
    </div>
  );
}

function Money({ t }: { t: number }) {
  const s = useLoad(`monetization:${t}`, () => getMonetization(t > 0));
  return <Slot s={s}>{(d) => <MonetizationSection data={d} />}</Slot>;
}

function Audience({ t }: { t: number }) {
  const f = t > 0;
  const demo = useLoad(`demographics:${t}`, () => getDemographics());
  const audience = useLoad(`audience:${t}`, () => getAudience(f));
  const heatmap = useLoad(`heatmap:${t}`, () => getHeatmap(f));
  return (
    <div className="space-y-8">
      <Slot s={demo}>{(d) => <DemographicsSection data={d} />}</Slot>
      <Slot s={audience}>{(d) => <AudienceSection audience={d} heatmap={heatmap.data} />}</Slot>
    </div>
  );
}

function Gender({ t }: { t: number }) {
  const s = useLoad(`gender:${t}`, () => getGenderAnalytics(t > 0));
  return <Slot s={s}>{(d) => <GenderSection data={d} />}</Slot>;
}

function Cities({ t }: { t: number }) {
  const cities = useLoad(`cities:${t}`, () => getCities(t > 0));
  // Not cached server-side, so no `force`.
  const waitlist = useLoad(`waitlist:${t}`, () => getWaitlist());
  return (
    <div className="space-y-8">
      <Slot s={cities}>{(d) => <CitiesSection data={d} />}</Slot>
      {waitlist.error ? (
        <InlineError message={waitlist.error} />
      ) : (
        <WaitlistSection data={waitlist.data} loading={waitlist.loading} />
      )}
    </div>
  );
}

function Algorithm({ t }: { t: number }) {
  const algo = useLoad(`algorithm:${t}`, () => getAlgorithm(t > 0));
  const matches = useLoad(`matches:${t}`, () => getMatches());
  return (
    <div className="space-y-8">
      <Slot s={algo}>{(d) => <AlgorithmSection data={d} />}</Slot>
      <Slot s={matches}>{(d) => <MatchesSection data={d} />}</Slot>
      <WeeklyMatchesSection />
    </div>
  );
}

/**
 * «Рост и деньги»: the pre-Pulse sections, regrouped. Each sub-section loads
 * only its own endpoints when opened — no boot fan-out — and each request
 * settles on its own.
 */
export default function GrowthTab({
  sub,
  onSub,
  reloadToken,
}: {
  sub: GrowthSub;
  onSub: (s: GrowthSub) => void;
  reloadToken: number;
}) {
  const t = reloadToken;
  return (
    <div className="space-y-5">
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/10 pb-2">
        {GROWTH_SUBS.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={s.key === sub}
            onClick={() => onSub(s.key)}
            className={`shrink-0 cursor-pointer rounded px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
              s.key === sub ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {sub === "funnels" && <Funnels t={t} />}
      {sub === "core" && <Core t={t} />}
      {sub === "retention" && <Retention t={t} />}
      {sub === "money" && <Money t={t} />}
      {/* Loads itself: its own period and granularity. */}
      {sub === "virality" && <ViralitySection />}
      {sub === "audience" && <Audience t={t} />}
      {sub === "gender" && <Gender t={t} />}
      {sub === "cities" && <Cities t={t} />}
      {sub === "algorithm" && <Algorithm t={t} />}
    </div>
  );
}
