import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import DataFreshness from "../components/DataFreshness";
import {
  getDemographics,
  getFunnel,
  getMatches,
  getReportsStats,
  getAudience,
  getCities,
  getWaitlist,
  getHeatmap,
  getAlgorithm,
  getGenderAnalytics,
  getRetention,
  getDates,
  getVerification,
  getMonetization,
  getAdminDashboard,
  type AdminDashboardData,
  type DemographicsData,
  type FunnelData,
  type MatchesData,
  type ReportsStatsData,
  type AudienceData,
  type CitiesData,
  type WaitlistData,
  type HeatmapData,
  type AlgorithmData,
  type GenderData,
  type RetentionData,
  type DatesData,
  type VerificationData,
  type MonetizationData,
  getDataGeneratedAt,
} from "../lib/api";
import { clearApiKey } from "../lib/auth";
import DemographicsSection from "../components/DemographicsSection";
import FunnelSection from "../components/FunnelSection";
import MatchesSection from "../components/MatchesSection";
import ReportsSection from "../components/ReportsSection";
import AudienceSection from "../components/AudienceSection";
import CitiesSection from "../components/CitiesSection";
import WaitlistSection from "../components/WaitlistSection";
import AlgorithmSection from "../components/AlgorithmSection";
import GenderSection from "../components/GenderSection";
import GrowthSection from "../components/GrowthSection";
import MonetizationSection from "../components/MonetizationSection";
import CoreMetricsSection from "../components/CoreMetricsSection";
import WeeklyMatchesSection from "../components/WeeklyMatchesSection";

type TabKey =
  | "core"
  | "overview"
  | "matches"
  | "audience"
  | "cities"
  | "algorithm"
  | "gender"
  | "growth"
  | "monetization";

interface DashboardState {
  demographics: DemographicsData | null;
  funnel: FunnelData | null;
  matches: MatchesData | null;
  reports: ReportsStatsData | null;
  audience: AudienceData | null;
  cities: CitiesData | null;
  /** Спрос на ещё не открытые города. Отдельно от `cities` — см. WaitlistSection. */
  waitlist: WaitlistData | null;
  heatmap: HeatmapData | null;
  algorithm: AlgorithmData | null;
  gender: GenderData | null;
  retention: RetentionData | null;
  dates: DatesData | null;
  verification: VerificationData | null;
  monetization: MonetizationData | null;
  core: AdminDashboardData | null;
}

const TABS: Array<{ key: TabKey; label: string; description: string }> = [
  {
    key: "core",
    label: "Core metrics",
    description:
      "The daily read: paid dates, net Match → Ticket conversion, gender balance. Test and synthetic accounts are out of every denominator.",
  },
  {
    key: "overview",
    label: "Overview",
    description: "Headline KPIs and the safety report queue.",
  },
  {
    key: "matches",
    label: "Weekly matches",
    description:
      "Every pair from the last drop — both users' data, photos, and attractiveness score.",
  },
  {
    key: "audience",
    label: "Audience",
    description: "Demographics, interests, psychology, geography.",
  },
  {
    key: "cities",
    label: "Cities",
    description:
      "Demographic split by city — date departure point where known, else matching city.",
  },
  {
    key: "algorithm",
    label: "Match algorithm",
    description: "Synergy calibration and scoring component diagnostics.",
  },
  {
    key: "gender",
    label: "Gender balance",
    description: "M/F dynamics, wait times, skewed universities.",
  },
  {
    key: "growth",
    label: "Growth & trust",
    description: "Retention, date quality, verification, reports.",
  },
  {
    key: "monetization",
    label: "Monetization",
    description:
      "What share of acquired users pay — and which channel, gender, city and track they come from.",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardState>({
    demographics: null,
    funnel: null,
    matches: null,
    reports: null,
    audience: null,
    cities: null,
    waitlist: null,
    heatmap: null,
    algorithm: null,
    gender: null,
    retention: null,
    dates: null,
    verification: null,
    monetization: null,
    core: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("core");
  /**
   * Bumped by Refresh. The analytics endpoints are served from a server-side
   * cache with TTLs up to 30 minutes, so re-running the same requests would
   * hand back the same numbers — `force` makes them actually recompute.
   */
  const [reloadToken, setReloadToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const force = reloadToken > 0;

    async function load() {
      try {
        // Fan-out — eight backend roundtrips, each cached server-side, so
        // first paint cost ≈ slowest endpoint. settle individually so one
        // slow endpoint doesn't block the whole page.
        const [
          demographics,
          funnel,
          matches,
          reports,
          audience,
          cities,
          waitlist,
          heatmap,
          algorithm,
          gender,
          retention,
          dates,
          verification,
          monetization,
          core,
        ] = await Promise.all([
          getDemographics(),
          getFunnel(),
          getMatches(),
          getReportsStats(),
          getAudience(force),
          getCities(force).catch(() => null),
          // Не кэшируется на сервере, поэтому без `force`: сигнал спроса,
          // которому полчаса, — единственное, чем он быть не должен.
          getWaitlist().catch(() => null),
          getHeatmap(force).catch(() => null),
          getAlgorithm(force),
          getGenderAnalytics(force),
          getRetention(force),
          getDates(force),
          getVerification(force),
          // Newest tab: tolerate a server that predates it rather than
          // blanking the whole dashboard behind one 404.
          getMonetization(force).catch(() => null),
          // Same tolerance, and it earns it: `derived.conversion` is newer
          // than this bundle's own deploy cadence, so a stale API answers
          // without those fields (or 404s) and must not take the page down.
          getAdminDashboard().catch(() => null),
        ]);
        if (!cancelled) {
          setData({
            demographics,
            funnel,
            matches,
            reports,
            audience,
            cities,
            waitlist,
            heatmap,
            algorithm,
            gender,
            retention,
            dates,
            verification,
            monetization,
            core,
          });
          setGeneratedAt(getDataGeneratedAt());
          setLoading(false);
          setRefreshing(false);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          if (msg === "Invalid API key" || msg === "Not authenticated") {
            navigate("/login", { replace: true });
            return;
          }
          setError(msg);
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate, reloadToken]);

  function handleLogout() {
    clearApiKey();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121316]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-rose-600 border-t-white" />
          <p className="mt-4 text-xs font-semibold tracking-wide text-rose-200/70 uppercase">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121316] px-4">
        <div className="glass-card-borderless max-w-md rounded-3xl p-8 text-center">
          <p className="text-xs font-medium text-rose-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inner-glow-cherry mt-4 cursor-pointer rounded-2xl px-5 py-2.5 text-xs font-bold text-white transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeTabMeta = TABS.find((t) => t.key === activeTab);

  return (
    <div className="min-h-screen bg-[#121316] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="glass-card-borderless mx-auto mb-6 flex max-w-7xl items-center justify-between rounded-3xl p-4.5">
        <div className="flex items-center gap-3.5">
          <Logo className="h-11 w-11" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Gennety Analytics
            </h1>
            <p className="text-[11px] font-medium text-rose-200/70">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshness
            generatedAt={generatedAt}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setReloadToken((n) => n + 1);
            }}
          />
          <nav className="flex items-center gap-1.5 rounded-2xl bg-[#17181c] p-1.5 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <Link
              to="/"
              className="inner-glow-cherry rounded-xl px-4 py-2 text-xs font-bold tracking-wide text-white"
            >
              Analytics
            </Link>
            <Link
              to="/users"
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Users
            </Link>
            <Link
              to="/purchases"
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Purchases
            </Link>
            <Link
              to="/ad-spend"
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Ad Spend
            </Link>
            <Link
              to="/dialogs"
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Dialogs
            </Link>
            <Link
              to="/reports"
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Reports
            </Link>
          </nav>
          <button
            onClick={handleLogout}
            className="inner-glow cursor-pointer rounded-2xl px-4 py-2.5 text-xs font-semibold text-rose-300/80 hover:text-rose-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tier 3 alert banner */}
      {data.reports && data.reports.unreviewedTier3 > 0 && (
        <div className="mx-auto mb-6 max-w-7xl">
          <Link
            to="/reports?tier=3&reviewed=false"
            className="group flex items-center gap-3.5 rounded-2xl bg-rose-950/40 px-5 py-3.5 shadow-xl [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3),inset_0_0_16px_rgba(244,63,94,0.15)] transition-all hover:bg-rose-950/60"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <span className="text-xs font-semibold text-rose-200">
              {data.reports.unreviewedTier3} Tier 3 safety report
              {data.reports.unreviewedTier3 > 1 ? "s" : ""} pending review
            </span>
            <span className="ml-auto text-xs font-medium text-rose-400 transition-transform group-hover:translate-x-0.5">
              View reports &rarr;
            </span>
          </Link>
        </div>
      )}

      {/* Tab navigation — sticky segment bar with inner edge spray */}
      <div className="sticky top-4 z-20 mx-auto mb-8 max-w-7xl rounded-3xl bg-[#17181c]/90 p-2 shadow-2xl backdrop-blur-2xl [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_0_20px_rgba(0,0,0,0.5)]">
        <div className="no-scrollbar flex overflow-x-auto gap-1.5">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex shrink-0 items-center justify-center cursor-pointer rounded-2xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "inner-glow-cherry text-white"
                    : "inner-glow text-slate-300 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {activeTabMeta && (
          <p className="mt-2 px-2 text-[11px] font-medium text-slate-400/70">
            {activeTabMeta.description}
          </p>
        )}
      </div>

      {/* Tab body */}
      <div className="mx-auto max-w-7xl">
        {activeTab === "core" &&
          (data.core?.conversion && data.core?.genderRatio ? (
            <CoreMetricsSection data={data.core} />
          ) : (
            // The dashboard auto-deploys on push while the API is deployed by
            // hand, so this tab can land ahead of the fields it reads. Testing
            // `conversion` rather than the response itself matters: an older
            // server answers /admin/dashboard perfectly well, just without
            // these blocks, and rendering that would throw on undefined.
            <div className="glass-card-borderless rounded-3xl p-8 text-center">
              <p className="text-sm font-bold text-white">
                Core metrics are not available yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed font-medium text-rose-200/60">
                The API answered <code>/admin/dashboard</code> without{" "}
                <code>conversion</code> / <code>genderRatio</code>. This tab
                ships ahead of the server it reads, so it will fill in on the
                next backend deploy.
              </p>
            </div>
          ))}

        {activeTab === "overview" && (
          <div className="space-y-10">
            {data.demographics && <DemographicsSection data={data.demographics} />}
            {data.funnel && <FunnelSection data={data.funnel} />}
            {data.matches && <MatchesSection data={data.matches} />}
            {data.reports && <ReportsSection data={data.reports} />}
          </div>
        )}

        {activeTab === "matches" && <WeeklyMatchesSection />}

        {activeTab === "audience" && data.audience && (
          <AudienceSection audience={data.audience} heatmap={data.heatmap} />
        )}

        {activeTab === "cities" && (
          <div className="space-y-12">
            {data.cities && <CitiesSection data={data.cities} />}
            <WaitlistSection data={data.waitlist} loading={loading} />
          </div>
        )}

        {activeTab === "algorithm" && data.algorithm && (
          <AlgorithmSection data={data.algorithm} />
        )}

        {activeTab === "gender" && data.gender && (
          <GenderSection data={data.gender} />
        )}

        {activeTab === "monetization" &&
          (data.monetization ? (
            <MonetizationSection data={data.monetization} />
          ) : (
            // The dashboard auto-deploys on push while the API is deployed by
            // hand, so this tab can legitimately land before its endpoint
            // exists. Say that, rather than render an empty panel — a silently
            // blank tab is indistinguishable from a broken one.
            <div className="glass-card-borderless rounded-3xl p-8 text-center">
              <p className="text-sm font-bold text-white">Monetization is not available yet</p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed font-medium text-rose-200/60">
                The API did not answer <code>/admin/analytics/monetization</code>. This tab ships
                ahead of the server it reads, so it will fill in on the next backend deploy.
              </p>
            </div>
          ))}

        {activeTab === "growth" &&
          data.retention &&
          data.dates &&
          data.verification && (
            <GrowthSection
              retention={data.retention}
              dates={data.dates}
              verification={data.verification}
            />
          )}
      </div>
    </div>
  );
}
