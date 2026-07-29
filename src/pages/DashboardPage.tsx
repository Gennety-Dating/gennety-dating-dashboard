import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getDemographics,
  getFunnel,
  getMatches,
  getReportsStats,
  getAudience,
  getCities,
  getHeatmap,
  getAlgorithm,
  getGenderAnalytics,
  getRetention,
  getDates,
  getVerification,
  type DemographicsData,
  type FunnelData,
  type MatchesData,
  type ReportsStatsData,
  type AudienceData,
  type CitiesData,
  type HeatmapData,
  type AlgorithmData,
  type GenderData,
  type RetentionData,
  type DatesData,
  type VerificationData,
} from "../lib/api";
import { clearApiKey } from "../lib/auth";
import DemographicsSection from "../components/DemographicsSection";
import FunnelSection from "../components/FunnelSection";
import MatchesSection from "../components/MatchesSection";
import ReportsSection from "../components/ReportsSection";
import AudienceSection from "../components/AudienceSection";
import CitiesSection from "../components/CitiesSection";
import AlgorithmSection from "../components/AlgorithmSection";
import GenderSection from "../components/GenderSection";
import GrowthSection from "../components/GrowthSection";
import WeeklyMatchesSection from "../components/WeeklyMatchesSection";

type TabKey =
  | "overview"
  | "matches"
  | "audience"
  | "cities"
  | "algorithm"
  | "gender"
  | "growth";

interface DashboardState {
  demographics: DemographicsData | null;
  funnel: FunnelData | null;
  matches: MatchesData | null;
  reports: ReportsStatsData | null;
  audience: AudienceData | null;
  cities: CitiesData | null;
  heatmap: HeatmapData | null;
  algorithm: AlgorithmData | null;
  gender: GenderData | null;
  retention: RetentionData | null;
  dates: DatesData | null;
  verification: VerificationData | null;
}

const TABS: Array<{ key: TabKey; label: string; description: string }> = [
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
    heatmap: null,
    algorithm: null,
    gender: null,
    retention: null,
    dates: null,
    verification: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  useEffect(() => {
    let cancelled = false;

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
          heatmap,
          algorithm,
          gender,
          retention,
          dates,
          verification,
        ] = await Promise.all([
          getDemographics(),
          getFunnel(),
          getMatches(),
          getReportsStats(),
          getAudience(),
          getCities().catch(() => null),
          getHeatmap().catch(() => null),
          getAlgorithm(),
          getGenderAnalytics(),
          getRetention(),
          getDates(),
          getVerification(),
        ]);
        if (!cancelled) {
          setData({
            demographics,
            funnel,
            matches,
            reports,
            audience,
            cities,
            heatmap,
            algorithm,
            gender,
            retention,
            dates,
            verification,
          });
          setLoading(false);
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
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function handleLogout() {
    clearApiKey();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 cursor-pointer rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeTabMeta = TABS.find((t) => t.key === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between rounded-2xl bg-slate-900/60 p-4 shadow-xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md shadow-violet-500/20">
            <span className="text-lg font-black text-white">G</span>
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              Gennety Analytics
            </h1>
            <p className="text-xs font-medium text-slate-400">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 rounded-xl bg-slate-950/60 p-1 ring-1 ring-white/5">
            <Link
              to="/"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/30 transition-all"
            >
              Analytics
            </Link>
            <Link
              to="/users"
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:text-white hover:bg-white/5"
            >
              Users
            </Link>
            <Link
              to="/dialogs"
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:text-white hover:bg-white/5"
            >
              Dialogs
            </Link>
            <Link
              to="/reports"
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:text-white hover:bg-white/5"
            >
              Reports
            </Link>
          </nav>
          <button
            onClick={handleLogout}
            className="cursor-pointer rounded-xl bg-slate-950/60 px-3.5 py-2 text-xs font-medium text-slate-400 ring-1 ring-white/5 transition-all hover:bg-red-500/10 hover:text-red-300 hover:ring-red-500/20"
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
            className="group flex items-center gap-3 rounded-2xl bg-red-500/10 px-5 py-3.5 shadow-lg shadow-red-950/20 backdrop-blur-xl ring-1 ring-red-500/20 transition-all hover:bg-red-500/15 hover:ring-red-500/40"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-semibold text-red-200">
              {data.reports.unreviewedTier3} Tier 3 safety report
              {data.reports.unreviewedTier3 > 1 ? "s" : ""} pending review
            </span>
            <span className="ml-auto text-xs font-medium text-red-400/80 transition-transform group-hover:translate-x-0.5">
              View reports &rarr;
            </span>
          </Link>
        </div>
      )}

      {/* Tab navigation — sticky segment bar */}
      <div className="sticky top-4 z-20 mx-auto mb-8 max-w-7xl rounded-2xl bg-slate-900/80 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl ring-1 ring-white/10">
        <div className="no-scrollbar flex overflow-x-auto gap-1">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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

        {activeTab === "cities" && data.cities && (
          <CitiesSection data={data.cities} />
        )}

        {activeTab === "algorithm" && data.algorithm && (
          <AlgorithmSection data={data.algorithm} />
        )}

        {activeTab === "gender" && data.gender && (
          <GenderSection data={data.gender} />
        )}

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
