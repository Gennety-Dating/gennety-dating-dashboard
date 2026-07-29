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
      <div className="mx-auto mb-8 flex max-w-[110rem] items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gennety Analytics</h1>
          <p className="text-sm text-slate-400">Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex overflow-hidden rounded-lg border border-slate-700">
            <Link to="/" className="px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
              Analytics
            </Link>
            <Link
              to="/users"
              className="border-l border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Users
            </Link>
            <Link
              to="/dialogs"
              className="border-l border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
            >
              Dialogs
            </Link>
            <Link
              to="/reports"
              className="border-l border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Reports
            </Link>
          </nav>
          <button
            onClick={() => {
              clearApiKey();
              navigate("/login", { replace: true });
            }}
            className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
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
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {list.error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_1fr]">
          {/* ── List pane ─────────────────────────────────────── */}
          <div className="flex max-h-[78vh] flex-col rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="space-y-2 border-b border-slate-800 p-3">
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  placeholder="Name, email, @username, tg id"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
                />
                <button
                  onClick={applyFilters}
                  className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
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
                className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "" ? "All statuses" : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                </div>
              ) : rows.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-500">No dialogs found.</p>
              ) : (
                rows.map((r) => {
                  const active = r.id === selectedId;
                  const p = r.participant;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`block w-full cursor-pointer border-b border-slate-800/60 px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-violet-500/10" : "hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-100">
                          {p.displayName ?? `tg:${p.telegramId}`}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-500">
                          {formatWhen(r.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        <span className="rounded bg-slate-800 px-1 text-slate-400">{p.status}</span>
                        {p.city && <span>{p.city}</span>}
                        <span>· {r.counts.total} msg</span>
                      </div>
                      {r.lastMessage?.text && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          <span className="text-slate-600">
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

            <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2 text-xs text-slate-500">
              <span>{total} total</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || listLoading}
                  className="cursor-pointer rounded border border-slate-700 px-2 py-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>
                <span>
                  {page + 1}/{maxPage + 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                  disabled={page >= maxPage || listLoading}
                  className="cursor-pointer rounded border border-slate-700 px-2 py-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* ── Transcript pane ───────────────────────────────── */}
          <div className="flex max-h-[78vh] min-h-[30rem] flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                Select a dialog to read it.
              </div>
            ) : detailLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : current?.error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {current.error}
              </div>
            ) : current?.data ? (
              <>
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-800 pb-3">
                  <h3 className="text-base font-semibold text-white">
                    {current.data.participant.displayName ??
                      `tg:${current.data.participant.telegramId}`}
                  </h3>
                  <span className="text-xs text-slate-500">
                    tg:{current.data.participant.telegramId}
                    {current.data.participant.telegramUsername &&
                      ` · @${current.data.participant.telegramUsername}`}
                  </span>
                  <Link
                    to={`/users/${current.data.participant.userId}`}
                    className="ml-auto text-xs text-violet-400 hover:text-violet-300"
                  >
                    Full profile →
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
