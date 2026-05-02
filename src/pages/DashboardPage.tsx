import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getDemographics,
  getFunnel,
  getMatches,
  getReportsStats,
  getAudience,
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
import AlgorithmSection from "../components/AlgorithmSection";
import GenderSection from "../components/GenderSection";
import GrowthSection from "../components/GrowthSection";

type TabKey = "overview" | "audience" | "algorithm" | "gender" | "growth";

interface DashboardState {
  demographics: DemographicsData | null;
  funnel: FunnelData | null;
  matches: MatchesData | null;
  reports: ReportsStatsData | null;
  audience: AudienceData | null;
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
    key: "audience",
    label: "Audience",
    description: "Demographics, interests, psychology, geography.",
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
      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gennety Analytics</h1>
          <p className="text-sm text-slate-400">Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex overflow-hidden rounded-lg border border-slate-700">
            <Link
              to="/"
              className="bg-slate-800 px-3 py-1.5 text-sm text-white"
            >
              Analytics
            </Link>
            <Link
              to="/users"
              className="border-l border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Users
            </Link>
            <Link
              to="/reports"
              className="border-l border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Reports
            </Link>
          </nav>
          <button
            onClick={handleLogout}
            className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
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
            className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 transition hover:bg-red-500/15"
          >
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
            <span className="text-sm font-medium text-red-300">
              {data.reports.unreviewedTier3} Tier 3 safety report
              {data.reports.unreviewedTier3 > 1 ? "s" : ""} pending review
            </span>
            <span className="ml-auto text-xs text-red-400/70">
              View reports &rarr;
            </span>
          </Link>
        </div>
      )}

      {/* Tab navigation — sticky so it stays in view across long sections */}
      <div className="sticky top-0 z-10 mx-auto mb-8 max-w-7xl border-b border-slate-800 bg-slate-950/95 pb-2 backdrop-blur">
        <div className="-mx-1 flex overflow-x-auto pt-2">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`mx-1 cursor-pointer rounded-lg border px-4 py-2 text-sm whitespace-nowrap transition ${
                  isActive
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {activeTabMeta && (
          <p className="mt-2 px-1 text-xs text-slate-500">
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

        {activeTab === "audience" && data.audience && (
          <AudienceSection audience={data.audience} heatmap={data.heatmap} />
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
