import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
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

/**
 * Each tab used to carry a paragraph, printed inside the sticky bar. It cost
 * height on every scroll to re-explain the tab the operator had just clicked,
 * and every section underneath already states its own scope.
 */
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "core", label: "Core metrics" },
  { key: "overview", label: "Overview" },
  { key: "matches", label: "Weekly matches" },
  { key: "audience", label: "Audience" },
  { key: "cities", label: "Cities" },
  { key: "algorithm", label: "Match algorithm" },
  { key: "gender", label: "Gender balance" },
  { key: "growth", label: "Growth & trust" },
  { key: "monetization", label: "Monetization" },
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
          <p className="mt-3 text-xs text-slate-500">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="panel max-w-md rounded-lg p-8 text-center">
          <p className="text-xs text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary mt-4 cursor-pointer rounded-md px-4 py-2 text-xs font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader
        actions={
          <DataFreshness
            generatedAt={generatedAt}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setReloadToken((n) => n + 1);
            }}
          />
        }
      />

      {/* Tier 3 alert banner */}
      {data.reports && data.reports.unreviewedTier3 > 0 && (
        <div className="mx-auto mb-4 max-w-7xl">
          {/* The one place rose is allowed to shout. The dot no longer pings:
              an animation that never stops stops being read as urgent. */}
          <Link
            to="/reports?tier=3&reviewed=false"
            className="flex items-center gap-3 rounded-md border border-rose-500/30 bg-rose-950/30 px-4 py-2.5 transition-colors hover:bg-rose-950/50"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
            <span className="text-xs font-medium text-rose-200">
              {data.reports.unreviewedTier3} Tier 3 safety report
              {data.reports.unreviewedTier3 > 1 ? "s" : ""} pending review
            </span>
            <span className="ml-auto text-xs text-rose-400">
              View reports &rarr;
            </span>
          </Link>
        </div>
      )}

      {/* Sticky tab bar. Kept as thin as it can be while staying tappable —
          it occupies the top of the viewport for the whole session. */}
      <div className="panel sticky top-3 z-20 mx-auto mb-5 max-w-7xl rounded-md p-1">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                aria-pressed={isActive}
                className={`shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                  isActive ? "btn-primary" : "btn"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
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
            <div className="panel rounded-lg p-8 text-center">
              <p className="text-sm font-medium text-white">
                Core metrics are not available yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                The API answered <code>/admin/dashboard</code> without{" "}
                <code>conversion</code> / <code>genderRatio</code>. This tab
                ships ahead of the server it reads, so it will fill in on the
                next backend deploy.
              </p>
            </div>
          ))}

        {activeTab === "overview" && (
          <div className="space-y-8">
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
          <div className="space-y-8">
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
            <div className="panel rounded-lg p-8 text-center">
              <p className="text-sm font-medium text-white">Monetization is not available yet</p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
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
