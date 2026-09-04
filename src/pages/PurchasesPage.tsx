import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import PurchasesTable from "../components/purchases/PurchasesTable";
import UserProfileDrawer from "../components/users/UserProfileDrawer";
import { getPurchases, type PurchasesResponse, type PurchaseKind, type PurchaseStatus } from "../lib/api";
import ErrorBanner from "../components/ErrorBanner";

/**
 * Revenue ledger — every real money movement in the product, newest first.
 *
 * Unifies five paid surfaces (ticket store, date-ticket gate, Premium,
 * Rematch, venue change) across both rails (Telegram Stars and App Store).
 * Clicking a row opens that payer's profile, which carries their full
 * purchase history.
 */

const PAGE_SIZE = 50;

const KIND_FILTERS: Array<{ value: PurchaseKind | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "tickets", label: "Ticket store" },
  { value: "date_ticket", label: "Date ticket" },
  { value: "premium", label: "Premium" },
  { value: "rematch", label: "Rematch" },
  { value: "venue_change", label: "Venue change" },
];

const STATUS_FILTERS: Array<{ value: PurchaseStatus | ""; label: string }> = [
  { value: "", label: "Any status" },
  { value: "settled", label: "Settled" },
  { value: "processing", label: "Processing" },
  { value: "refunded", label: "Refunded" },
  { value: "refund_failed", label: "Refund failed" },
];

const KIND_LABEL: Record<string, string> = {
  tickets: "Ticket store",
  date_ticket: "Date ticket",
  premium: "Premium",
  rematch: "Rematch",
  venue_change: "Venue change",
};

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PurchasesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [kind, setKind] = useState<PurchaseKind | "">("");
  const [status, setStatus] = useState<PurchaseStatus | "">("");
  // One state object keyed by the request it answers, mirroring UsersPage:
  // `loading` is DERIVED from "the result in hand is not for the query on
  // screen", which avoids a setState inside the effect body.
  const [result, setResult] = useState<{
    key: string;
    data: PurchasesResponse | null;
    error: string;
  } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const queryKey = `${page}|${kind}|${status}`;

  useEffect(() => {
    let cancelled = false;

    getPurchases({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, kind, status })
      .then((res) => {
        if (cancelled) return;
        setResult({ key: `${page}|${kind}|${status}`, data: res, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setResult({ key: `${page}|${kind}|${status}`, data: null, error: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [page, kind, status, navigate]);

  const loading = result === null || result.key !== queryKey;
  const data = result?.key === queryKey ? result.data : null;
  const error = result?.key === queryKey ? result.error : "";

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totals = data?.totals;
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-canvas px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader />

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Purchases"
          description="Every real money movement, across Telegram Stars and the App Store."
        />

        {error && (
          <ErrorBanner className="mb-4" message={error} />
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Purchases"
            value={totals?.count ?? 0}
            sub={
              totals?.refundedCount ? `${totals.refundedCount} refunded` : "matching the filter"
            }
            accent
          />
          <StatCard
            label="Revenue"
            value={totals ? usd(totals.usdCents) : "$0.00"}
            sub="refunds excluded"
            info="Stars are converted at the documented $0.02/⭐ ticket rate — Telegram publishes no Stars→USD rate, so any figure derived from Stars is an estimate. App Store rows use Apple's real price."
          />
          <StatCard
            label="Telegram Stars"
            value={totals?.stars ?? 0}
            sub="⭐ collected"
            info="Sum of the Stars actually charged, frozen on each row at purchase time."
          />
          <StatCard
            label="Needs attention"
            value={rows.filter((row) => row.status === "refund_failed").length}
            sub="refunds we owe but could not pay"
            info="A refund_failed row means the provider call failed — the money is still with us and the hourly sweep is retrying. Anything sitting here for long needs a human."
          />
        </div>

        <div className="panel mb-5 flex flex-wrap items-center gap-2 rounded-lg p-4">
          <div className="flex flex-wrap gap-1.5">
            {KIND_FILTERS.map((filter) => (
              <button
                key={filter.value || "all"}
                onClick={() => {
                  setKind(filter.value);
                  setPage(0);
                }}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold ${
                  kind === filter.value
                    ? "btn-primary text-white"
                    : "btn text-slate-300 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as PurchaseStatus | "");
                setPage(0);
              }}
              className="cursor-pointer rounded-md border border-white/10 bg-canvas px-3 py-2 text-[11px] font-medium text-slate-300 outline-none focus:border-white/30"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value || "any"} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {data && data.byKind.length > 0 && (
          <div className="panel mb-5 flex flex-wrap gap-x-6 gap-y-2 rounded-lg p-4 text-xs">
            {data.byKind.map((entry) => (
              <div key={entry.kind}>
                <span className="text-slate-400">{KIND_LABEL[entry.kind] ?? entry.kind}: </span>
                <span className="font-semibold text-white">{usd(entry.usdCents)}</span>
                <span className="text-slate-500"> · {entry.count}</span>
              </div>
            ))}
          </div>
        )}

        <PurchasesTable rows={rows} loading={loading} onRowClick={setSelectedUserId} />

        <div className="panel mt-5 flex items-center justify-between rounded-lg p-3.5 text-xs text-slate-400">
          <div>
            {total > 0 ? (
              <>
                Showing <span className="font-semibold text-white">{from}</span>–
                <span className="font-semibold text-white">{to}</span> of{" "}
                <span className="font-semibold text-white">{total}</span> purchases
              </>
            ) : (
              "No purchases"
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn cursor-pointer rounded-md px-4 py-2 font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage}
              className="btn cursor-pointer rounded-md px-4 py-2 font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedUserId && (
        <UserProfileDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
