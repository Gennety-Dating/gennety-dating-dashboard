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
              className="px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
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
              className="border-l border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
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

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Moderation Reports"
          description="Review user reports triaged by the AI moderation engine"
        />

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              Tier
            </span>
            {(["all", "1", "2", "3"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setTierFilter(v);
                  setPage(0);
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  tierFilter === v
                    ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                    : "border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {v === "all" ? "All" : `T${v}`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              Status
            </span>
            {(["all", "pending", "reviewed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setReviewFilter(v);
                  setPage(0);
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition ${
                  reviewFilter === v
                    ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                    : "border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <ReportsTable
          reports={reports}
          loading={loading}
          onRowClick={setSelectedReportId}
        />

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <div>
            {total > 0 ? (
              <>
                Showing <span className="text-slate-200">{from}</span>–
                <span className="text-slate-200">{to}</span> of{" "}
                <span className="text-slate-200">{total}</span>
              </>
            ) : (
              !loading && "0 reports"
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page + 1} / {maxPage + 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage || loading}
              className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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
