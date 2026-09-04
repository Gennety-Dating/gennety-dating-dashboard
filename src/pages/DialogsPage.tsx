import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import {
  getDialogs,
  getDialog,
  type DialogListRow,
  type DialogDetail,
} from "../lib/api";
import DialogTranscript from "../components/dialogs/DialogTranscript";
import SectionHeader from "../components/SectionHeader";
import ErrorBanner from "../components/ErrorBanner";

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  "",
  "onboarding",
  "active",
  "paused",
  "frozen",
  "suspended",
  "pending_investigation",
  "banned",
];

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DialogsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  // Applied separately from the input so typing doesn't fire a request per key.
  const [applied, setApplied] = useState({ status: "", search: "" });

  const [list, setList] = useState<{
    key: string;
    rows: DialogListRow[];
    total: number;
    error: string;
  } | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    id: string;
    data: DialogDetail | null;
    error: string;
  } | null>(null);

  const listKey = `${page}|${applied.status}|${applied.search}`;
  const listLoading = list === null || list.key !== listKey;
  const rows = list?.rows ?? [];
  const total = list?.total ?? 0;

  useEffect(() => {
    let cancelled = false;
    getDialogs(PAGE_SIZE, page * PAGE_SIZE, {
      status: applied.status || undefined,
      search: applied.search || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setList({ key: listKey, rows: res.data, total: res.total, error: "" });
        // Auto-open the first dialog so the pane is never an empty stare.
        setSelectedId((cur) => cur ?? res.data[0]?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setList({ key: listKey, rows: [], total: 0, error: msg });
      });
    return () => {
      cancelled = true;
    };
  }, [listKey, page, applied.status, applied.search, navigate]);

  const detailLoading = !!selectedId && (detail === null || detail.id !== selectedId);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    getDialog(selectedId)
      .then((d) => {
        if (!cancelled) setDetail({ id: selectedId, data: d, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        setDetail({
          id: selectedId,
          data: null,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function applyFilters() {
    setPage(0);
    setApplied({ status, search: search.trim() });
  }

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const current = detail && detail.id === selectedId ? detail : null;

  return (
    <div className="min-h-screen bg-canvas px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader />

      <div className="mx-auto max-w-[110rem]">
        <SectionHeader
          title="Dialogs"
          description="Every message the bot sent, the buttons it offered, and what the user tapped."
        />

        {list?.error && (
          <ErrorBanner className="mb-4" message={list.error} />
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[22rem_1fr]">
          {/* ── List pane ─────────────────────────────────────── */}
          <div className="panel flex max-h-[78vh] flex-col rounded-lg overflow-hidden">
            <div className="space-y-2.5 border-b border-white/10 p-4">
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  placeholder="Name, email, @username..."
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-canvas px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-white/30"
                />
                <button
                  onClick={applyFilters}
                  className="btn-primary cursor-pointer rounded-md px-4 py-2.5 text-xs font-semibold text-white transition-colors"
                >
                  Go
                </button>
              </div>
              <div className="relative w-full">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(0);
                    setApplied({ status: e.target.value, search: search.trim() });
                  }}
                  className="w-full cursor-pointer appearance-none rounded-md border border-white/10 bg-canvas py-2 pr-10 pl-3 text-xs font-medium text-slate-200 outline-none transition-colors focus:border-white/30"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "" ? "All statuses" : s}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
              {listLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
                </div>
              ) : rows.length === 0 ? (
                <p className="px-3 py-10 text-center text-xs font-medium text-slate-500">No dialogs found.</p>
              ) : (
                rows.map((r) => {
                  const active = r.id === selectedId;
                  const p = r.participant;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`block w-full cursor-pointer px-4 py-3.5 text-left transition-colors ${
                        active
                          ? "bg-white/8"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-slate-100">
                          {p.displayName ?? `tg:${p.telegramId}`}
                        </span>
                        <span className="shrink-0 text-[10px] font-medium text-slate-400">
                          {formatWhen(r.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded-md bg-white/5 px-2 py-0.5 font-medium text-slate-300">{p.status}</span>
                        {p.city && <span className="text-slate-400">{p.city}</span>}
                        <span className="text-slate-400/80">· {r.counts.total} msg</span>
                      </div>
                      {r.lastMessage?.text && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-slate-400 leading-relaxed">
                          <span className="text-rose-400 font-semibold">
                            {r.lastMessage.direction === "in" ? "↑ " : "↓ "}
                          </span>
                          {r.lastMessage.text}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-400">
              <span className="font-semibold">{total} total</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || listLoading}
                  className="btn cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>
                <span className="text-xs font-semibold text-slate-300">
                  {page + 1}/{maxPage + 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                  disabled={page >= maxPage || listLoading}
                  className="btn cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* ── Transcript pane ───────────────────────────────── */}
          <div className="panel flex max-h-[78vh] min-h-[30rem] flex-col rounded-lg p-6">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center text-xs font-medium text-slate-500">
                Select a dialog to read it.
              </div>
            ) : detailLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
              </div>
            ) : current?.error ? (
              <ErrorBanner message={current.error} />
            ) : current?.data ? (
              <>
                <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/10 pb-3">
                  <h3 className="text-base font-semibold tracking-tight text-white">
                    {current.data.participant.displayName ??
                      `tg:${current.data.participant.telegramId}`}
                  </h3>
                  <span className="text-xs font-medium text-slate-400">
                    tg:{current.data.participant.telegramId}
                    {current.data.participant.telegramUsername &&
                      ` · @${current.data.participant.telegramUsername}`}
                  </span>
                  <Link
                    to={`/users/${current.data.participant.userId}`}
                    className="ml-auto text-xs font-semibold text-rose-400 transition-colors hover:text-rose-300"
                  >
                    Full profile &rarr;
                  </Link>
                </div>
                <div className="min-h-0 flex-1">
                  <DialogTranscript dialog={current.data} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
