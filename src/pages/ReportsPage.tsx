import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getReports,
  type ReportListItem,
} from "../lib/api";
import { clearApiKey } from "../lib/auth";
import ReportsTable from "../components/reports/ReportsTable";
import ReportDetailDrawer from "../components/reports/ReportDetailDrawer";
import SectionHeader from "../components/SectionHeader";

const PAGE_SIZE = 20;

type TierFilter = "all" | "1" | "2" | "3";
type ReviewFilter = "all" | "reviewed" | "pending";

function parsePageParam(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) - 1 : 0;
}

function parseTierFilter(value: string | null): TierFilter {
  return value === "1" || value === "2" || value === "3" ? value : "all";
}

function parseReviewFilter(value: string | null): ReviewFilter {
  if (value === "true") return "reviewed";
  if (value === "false") return "pending";
  return "all";
}

function buildSearchParams(
  page: number,
  tierFilter: TierFilter,
  reviewFilter: ReviewFilter,
): URLSearchParams {
  const params = new URLSearchParams();
  if (page > 0) params.set("page", String(page + 1));
  if (tierFilter !== "all") params.set("tier", tierFilter);
  if (reviewFilter === "reviewed") params.set("reviewed", "true");
  if (reviewFilter === "pending") params.set("reviewed", "false");
  return params;
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(() => parsePageParam(searchParams.get("page")));
  const [tierFilter, setTierFilter] = useState<TierFilter>(() =>
    parseTierFilter(searchParams.get("tier")),
  );
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>(() =>
    parseReviewFilter(searchParams.get("reviewed")),
  );

  const [result, setResult] = useState<{
    key: string;
    reports: ReportListItem[];
    total: number;
    error: string;
  } | null>(null);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const cacheKey = `${page}-${tierFilter}-${reviewFilter}`;
  const loading = result === null || result.key !== cacheKey;
  const reports = result?.key === cacheKey ? result.reports : [];
  const total = result?.key === cacheKey ? result.total : 0;
  const error = result?.key === cacheKey ? result.error : "";

  function loadReports() {
    const filters: { tier?: number; reviewed?: boolean } = {};
    if (tierFilter !== "all") filters.tier = Number(tierFilter);
    if (reviewFilter === "reviewed") filters.reviewed = true;
    if (reviewFilter === "pending") filters.reviewed = false;

    getReports(PAGE_SIZE, page * PAGE_SIZE, filters)
      .then((res) => {
        setResult({
          key: cacheKey,
          reports: res.data,
          total: res.total,
          error: "",
        });
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setResult({ key: cacheKey, reports: [], total: 0, error: msg });
      });
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tierFilter, reviewFilter, navigate]);

  useEffect(() => {
    const nextPage = parsePageParam(searchParams.get("page"));
    const nextTierFilter = parseTierFilter(searchParams.get("tier"));
    const nextReviewFilter = parseReviewFilter(searchParams.get("reviewed"));

    setPage((current) => (current === nextPage ? current : nextPage));
    setTierFilter((current) =>
      current === nextTierFilter ? current : nextTierFilter,
    );
    setReviewFilter((current) =>
      current === nextReviewFilter ? current : nextReviewFilter,
    );
  }, [searchParams]);

  useEffect(() => {
    const nextParams = buildSearchParams(page, tierFilter, reviewFilter);
    if (nextParams.toString() === searchParams.toString()) return;
    setSearchParams(nextParams, { replace: true });
  }, [page, reviewFilter, searchParams, setSearchParams, tierFilter]);

  function handleLogout() {
    clearApiKey();
    navigate("/login", { replace: true });
  }

  function handleReviewed() {
    setSelectedReportId(null);
    loadReports();
  }

  const selectedReport =
    selectedReportId !== null
      ? reports.find((r) => r.id === selectedReportId) ?? null
      : null;

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

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
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:text-white hover:bg-white/5"
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
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/30 transition-all"
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

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Moderation Reports"
          description="Review user reports triaged by the AI moderation engine"
        />

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-900/60 p-3.5 shadow-xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Tier
            </span>
            <div className="flex rounded-xl bg-slate-950/60 p-1 ring-1 ring-white/5">
              {(["all", "1", "2", "3"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setTierFilter(v);
                    setPage(0);
                  }}
                  className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                    tierFilter === v
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {v === "all" ? "All Tiers" : `Tier ${v}`}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Status
            </span>
            <div className="flex rounded-xl bg-slate-950/60 p-1 ring-1 ring-white/5">
              {(["all", "pending", "reviewed"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setReviewFilter(v);
                    setPage(0);
                  }}
                  className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                    reviewFilter === v
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-xs font-medium text-red-300 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        <ReportsTable
          reports={reports}
          loading={loading}
          onRowClick={setSelectedReportId}
        />

        {/* Pagination */}
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-900/40 p-4 backdrop-blur-xl ring-1 ring-white/5 text-xs text-slate-400">
          <div>
            {total > 0 ? (
              <>
                Showing <span className="font-semibold text-white">{from}</span>–
                <span className="font-semibold text-white">{to}</span> of{" "}
                <span className="font-semibold text-white">{total}</span> reports
              </>
            ) : (
              !loading && "0 reports"
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="cursor-pointer rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400/80">
              Page <span className="font-medium text-white">{page + 1}</span> / {maxPage + 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage || loading}
              className="cursor-pointer rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ReportDetailDrawer
        report={selectedReport}
        onClose={() => setSelectedReportId(null)}
        onReviewed={handleReviewed}
      />
    </div>
  );
}
