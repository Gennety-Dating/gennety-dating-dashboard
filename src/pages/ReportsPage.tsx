import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
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
          <nav className="flex items-center gap-1.5 rounded-2xl bg-[#17181c] p-1.5 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <Link
              to="/"
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
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
              to="/dialogs"
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Dialogs
            </Link>
            <Link
              to="/reports"
              className="inner-glow-cherry rounded-xl px-4 py-2 text-xs font-bold tracking-wide text-white"
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

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Moderation Reports"
          description="Review user reports triaged by the AI moderation engine"
        />

        {/* Filters */}
        <div className="glass-card-borderless mb-6 flex flex-wrap items-center gap-4 rounded-3xl p-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Tier
            </span>
            <div className="flex gap-1.5 rounded-2xl bg-[#17181c] p-1.5 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">
              {(["all", "1", "2", "3"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setTierFilter(v);
                    setPage(0);
                  }}
                  className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    tierFilter === v
                      ? "inner-glow-cherry text-white"
                      : "inner-glow text-slate-300 hover:text-white"
                  }`}
                >
                  {v === "all" ? "All Tiers" : `Tier ${v}`}
                </button>
              ))}
            </div>
          </div>

          <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Status
            </span>
            <div className="flex gap-1.5 rounded-2xl bg-[#17181c] p-1.5 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">
              {(["all", "pending", "reviewed"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setReviewFilter(v);
                    setPage(0);
                  }}
                  className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                    reviewFilter === v
                      ? "inner-glow-cherry text-white"
                      : "inner-glow text-slate-300 hover:text-white"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-950/40 p-4 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3),inset_0_0_10px_rgba(244,63,94,0.1)]">
            {error}
          </div>
        )}

        <ReportsTable
          reports={reports}
          loading={loading}
          onRowClick={setSelectedReportId}
        />

        {/* Pagination */}
        <div className="glass-card-borderless mt-5 flex items-center justify-between rounded-3xl p-4.5 text-xs text-slate-400">
          <div>
            {total > 0 ? (
              <>
                Showing <span className="font-bold text-white">{from}</span>–
                <span className="font-bold text-white">{to}</span> of{" "}
                <span className="font-bold text-white">{total}</span> reports
              </>
            ) : (
              !loading && "0 reports"
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="inner-glow cursor-pointer rounded-2xl px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400/80">
              Page <span className="font-bold text-white">{page + 1}</span> / {maxPage + 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage || loading}
              className="inner-glow cursor-pointer rounded-2xl px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
