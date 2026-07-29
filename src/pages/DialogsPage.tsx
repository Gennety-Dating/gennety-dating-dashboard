import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
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
    <div className="min-h-screen bg-[#121316] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="glass-card-borderless mx-auto mb-6 flex max-w-[110rem] items-center justify-between rounded-3xl p-4.5">
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
              className="inner-glow-cherry rounded-xl px-4 py-2 text-xs font-bold tracking-wide text-white"
            >
              Dialogs
            </Link>
            <Link
              to="/reports"
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Reports
            </Link>
          </nav>
          <button
            onClick={() => {
              clearApiKey();
              navigate("/login", { replace: true });
            }}
            className="inner-glow cursor-pointer rounded-2xl px-4 py-2.5 text-xs font-semibold text-rose-300/80 hover:text-rose-200"
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
          <div className="mb-4 rounded-2xl bg-rose-950/40 p-4 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3),inset_0_0_10px_rgba(244,63,94,0.1)]">
            {list.error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[22rem_1fr]">
          {/* ── List pane ─────────────────────────────────────── */}
          <div className="glass-card-borderless flex max-h-[78vh] flex-col rounded-3xl overflow-hidden">
            <div className="space-y-2.5 p-4 bg-[#17181c]/90 [box-shadow:inset_0_-1px_0_rgba(255,255,255,0.06)]">
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  placeholder="Name, email, @username..."
                  className="min-w-0 flex-1 rounded-2xl bg-[#121316] px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.2)] focus:[box-shadow:inset_0_1px_2px_rgba(255,255,255,0.4),inset_0_0_12px_rgba(244,63,94,0.25)] transition-all"
                />
                <button
                  onClick={applyFilters}
                  className="inner-glow-cherry cursor-pointer rounded-2xl px-4 py-2.5 text-xs font-bold text-white transition-all"
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
                className="w-full cursor-pointer rounded-2xl bg-[#121316] px-3.5 py-2.5 text-xs font-medium text-slate-200 outline-none [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "" ? "All statuses" : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
              {listLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-600 border-t-white" />
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
                      className={`block w-full cursor-pointer px-4 py-3.5 text-left transition-all ${
                        active
                          ? "bg-rose-950/40 [box-shadow:inset_3px_0_0_#f43f5e,inset_0_1px_1px_rgba(255,255,255,0.1)]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-xs font-bold text-slate-100">
                          {p.displayName ?? `tg:${p.telegramId}`}
                        </span>
                        <span className="shrink-0 text-[10px] font-medium text-slate-400">
                          {formatWhen(r.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded-xl bg-white/5 px-2 py-0.5 font-medium text-slate-300 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">{p.status}</span>
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

            <div className="flex items-center justify-between bg-slate-950/70 px-4 py-3 text-xs text-slate-400 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)]">
              <span className="font-semibold">{total} total</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || listLoading}
                  className="inner-glow cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>
                <span className="text-xs font-bold text-slate-300">
                  {page + 1}/{maxPage + 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                  disabled={page >= maxPage || listLoading}
                  className="inner-glow cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* ── Transcript pane ───────────────────────────────── */}
          <div className="glass-card-borderless flex max-h-[78vh] min-h-[30rem] flex-col rounded-3xl p-6">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center text-xs font-medium text-slate-500">
                Select a dialog to read it.
              </div>
            ) : detailLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-600 border-t-white" />
              </div>
            ) : current?.error ? (
              <div className="rounded-2xl bg-rose-950/40 p-4 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3)]">
                {current.error}
              </div>
            ) : current?.data ? (
              <>
                <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3.5 [box-shadow:inset_0_-1px_0_rgba(255,255,255,0.06)]">
                  <h3 className="text-base font-extrabold tracking-tight text-white">
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
                    className="ml-auto text-xs font-bold text-rose-400 transition-colors hover:text-rose-300"
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
