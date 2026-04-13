import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getDemographics,
  getFunnel,
  getMatches,
  type DemographicsData,
  type FunnelData,
  type MatchesData,
} from "../lib/api";
import { clearApiKey } from "../lib/auth";
import DemographicsSection from "../components/DemographicsSection";
import FunnelSection from "../components/FunnelSection";
import MatchesSection from "../components/MatchesSection";

interface DashboardState {
  demographics: DemographicsData | null;
  funnel: FunnelData | null;
  matches: MatchesData | null;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardState>({
    demographics: null,
    funnel: null,
    matches: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [demographics, funnel, matches] = await Promise.all([
          getDemographics(),
          getFunnel(),
          getMatches(),
        ]);
        if (!cancelled) {
          setData({ demographics, funnel, matches });
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
          </nav>
          <button
            onClick={handleLogout}
            className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-7xl space-y-10">
        {data.demographics && (
          <DemographicsSection data={data.demographics} />
        )}
        {data.funnel && <FunnelSection data={data.funnel} />}
        {data.matches && <MatchesSection data={data.matches} />}
      </div>
    </div>
  );
}
