import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import DataFreshness from "../components/DataFreshness";
import GrowthTab from "../components/pulse/GrowthTab";
import PeopleTab from "../components/pulse/PeopleTab";
import ScreensTab from "../components/pulse/ScreensTab";
import SummaryTab from "../components/pulse/SummaryTab";
import { getDataGeneratedAt, getReportsStats } from "../lib/api";
import { GROWTH_SUBS, TABS, type GrowthSub, type TabKey } from "../lib/analytics-tabs";
import { useLoad } from "../lib/useLoad";

/**
 * Analytics: four tabs, each loading only its own data.
 *
 * The page used to await fifteen requests in one `Promise.all` before the
 * first paint, and a single failing endpoint blanked everything. Now every
 * section owns its request (`useLoad`) and fails inline on its own.
 */
export default function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") as TabKey | null;
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? tabParam! : "summary";
  const gParam = params.get("g") as GrowthSub | null;
  const sub: GrowthSub = GROWTH_SUBS.some((s) => s.key === gParam) ? gParam! : "funnels";

  /**
   * Bumped by Refresh: every section re-requests with `?fresh=1`, because the
   * server caches these reads (5 to 60 minutes) and a refresh that re-served
   * the cache would claim currency it did not deliver.
   */
  const [reloadToken, setReloadToken] = useState(0);

  // The tier-3 banner is the one thing shown on every tab; it fails silently.
  const reports = useLoad(`reports-banner:${reloadToken}`, () => getReportsStats());

  function go(next: Record<string, string | null>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    setParams(p);
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader
        actions={
          <DataFreshness
            generatedAt={getDataGeneratedAt()}
            refreshing={false}
            onRefresh={() => setReloadToken((n) => n + 1)}
          />
        }
      />

      {reports.data && reports.data.unreviewedTier3 > 0 && (
        <div className="mx-auto mb-4 max-w-7xl">
          <Link
            to="/reports?tier=3&reviewed=false"
            className="flex items-center gap-3 rounded-md border border-rose-500/30 bg-rose-950/30 px-4 py-2.5 transition-colors hover:bg-rose-950/50"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
            <span className="text-xs font-medium text-rose-200">
              Жалобы Tier 3 без проверки: {reports.data.unreviewedTier3}
            </span>
            <span className="ml-auto text-xs text-rose-400">Открыть →</span>
          </Link>
        </div>
      )}

      <div className="panel sticky top-3 z-20 mx-auto mb-5 max-w-7xl rounded-md p-1">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const isActive = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => go({ tab: t.key === "summary" ? null : t.key, screen: null, user: null })}
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

      <main className="mx-auto max-w-7xl">
        {tab === "summary" && <SummaryTab reloadToken={reloadToken} />}
        {tab === "screens" && (
          <ScreensTab
            reloadToken={reloadToken}
            selected={params.get("screen")}
            onSelect={(screen) => go({ screen })}
          />
        )}
        {tab === "people" && (
          <PeopleTab
            reloadToken={reloadToken}
            selected={params.get("user")}
            onSelect={(user) => go({ user })}
          />
        )}
        {tab === "growth" && (
          <GrowthTab sub={sub} onSub={(g) => go({ g: g === "funnels" ? null : g })} reloadToken={reloadToken} />
        )}
      </main>
    </div>
  );
}
