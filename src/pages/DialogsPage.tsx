import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getDialogs,
  getDialog,
  type DialogListRow,
  type DialogDetail,
} from "../lib/api";
import { clearApiKey } from "../lib/auth";
import DialogTranscript from "../components/dialogs/DialogTranscript";
import SectionHeader from "../components/SectionHeader";

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
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mx-auto mb-6 flex max-w-[110rem] items-center justify-between rounded-2xl bg-slate-900/60 p-4 shadow-xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/5">
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
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/30 transition-all"
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
            onClick={() => {
              clearApiKey();
              navigate("/login", { replace: true });
            }}
            className="cursor-pointer rounded-xl bg-slate-950/60 px-3.5 py-2 text-xs font-medium text-slate-400 ring-1 ring-white/5 transition-all hover:bg-red-500/10 hover:text-red-300 hover:ring-red-500/20"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[110rem]">
        <SectionHeader
          title="Dialogs"
          description="Real user↔bot conversations — every message the bot sent, the buttons it offered, and what the user tapped."
        />

        {list?.error && (
          <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-xs font-medium text-red-300 ring-1 ring-red-500/20">
            {list.error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[22rem_1fr]">
          {/* ── List pane ─────────────────────────────────────── */}
          <div className="flex max-h-[78vh] flex-col rounded-2xl bg-slate-900/60 shadow-xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden">
            <div className="space-y-2.5 border-b border-white/5 p-3.5 bg-slate-950/40">
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  placeholder="Name, email, @username..."
                  className="min-w-0 flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none ring-1 ring-white/10 focus:ring-violet-500/80 transition-all"
                />
                <button
                  onClick={applyFilters}
                  className="cursor-pointer rounded-xl bg-violet-600/80 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-violet-600 transition-all"
                >
                  Go
                </button>
              </div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                  setApplied({ status: e.target.value, search: search.trim() });
                }}
                className="w-full cursor-pointer rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none ring-1 ring-white/10 focus:ring-violet-500/80 transition-all"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "" ? "All statuses" : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {listLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                </div>
              ) : rows.length === 0 ? (
                <p className="px-3 py-10 text-center text-xs text-slate-500">No dialogs found.</p>
              ) : (
                rows.map((r) => {
                  const active = r.id === selectedId;
                  const p = r.participant;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`block w-full cursor-pointer px-3.5 py-3 text-left transition-all ${
                        active
                          ? "bg-violet-600/15 border-l-2 border-violet-500"
                          : "hover:bg-white/[0.03]"
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
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-medium text-slate-400 ring-1 ring-white/10">{p.status}</span>
                        {p.city && <span className="text-slate-400">{p.city}</span>}
                        <span className="text-slate-400/80">· {r.counts.total} msg</span>
                      </div>
                      {r.lastMessage?.text && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-slate-400/90 leading-relaxed">
                          <span className="text-violet-400 font-medium">
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

            <div className="flex items-center justify-between border-t border-white/5 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-400">
              <span className="font-medium">{total} total</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || listLoading}
                  className="cursor-pointer rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>
                <span className="text-xs font-medium text-slate-400">
                  {page + 1}/{maxPage + 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                  disabled={page >= maxPage || listLoading}
                  className="cursor-pointer rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* ── Transcript pane ───────────────────────────────── */}
          <div className="flex max-h-[78vh] min-h-[30rem] flex-col rounded-2xl bg-slate-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/5">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-500">
                Select a dialog to read it.
              </div>
            ) : detailLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : current?.error ? (
              <div className="rounded-2xl bg-red-500/10 p-4 text-xs font-medium text-red-300 ring-1 ring-red-500/20">
                {current.error}
              </div>
            ) : current?.data ? (
              <>
                <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/5 pb-3.5">
                  <h3 className="text-base font-bold tracking-tight text-white">
                    {current.data.participant.displayName ??
                      `tg:${current.data.participant.telegramId}`}
                  </h3>
                  <span className="text-xs text-slate-400">
                    tg:{current.data.participant.telegramId}
                    {current.data.participant.telegramUsername &&
                      ` · @${current.data.participant.telegramUsername}`}
                  </span>
                  <Link
                    to={`/users/${current.data.participant.userId}`}
                    className="ml-auto text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
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
