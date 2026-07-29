import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsers, type UserListItem } from "../lib/api";
import { clearApiKey } from "../lib/auth";
import UsersTable from "../components/users/UsersTable";
import UserProfileDrawer from "../components/users/UserProfileDrawer";
import SectionHeader from "../components/SectionHeader";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    page: number;
    users: UserListItem[];
    total: number;
    error: string;
  } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loading = result === null || result.page !== page;
  const users = result?.users ?? [];
  const total = result?.total ?? 0;
  const error = result?.error ?? "";

  useEffect(() => {
    let cancelled = false;

    getUsers(PAGE_SIZE, page * PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setResult({ page, users: res.data, total: res.total, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setResult({ page, users: [], total: 0, error: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [page, navigate]);

  function handleLogout() {
    clearApiKey();
    navigate("/login", { replace: true });
  }

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#121316] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="glass-card-borderless mx-auto mb-6 flex max-w-7xl items-center justify-between rounded-3xl p-4.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-900 via-rose-700 to-rose-500 shadow-lg shadow-rose-950/50 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_0_12px_rgba(255,255,255,0.15)]">
            <span className="text-xl font-black text-white">G</span>
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
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
              className="inner-glow-cherry rounded-xl px-4 py-2 text-xs font-bold tracking-wide text-white"
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
              className="inner-glow rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
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
          title="User Profiles"
          description="Browse registered users and review their AI-generated psychological profiles"
        />

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-950/40 p-4 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3),inset_0_0_10px_rgba(244,63,94,0.1)]">
            {error}
          </div>
        )}

        <UsersTable
          users={users}
          loading={loading}
          onRowClick={setSelectedUserId}
        />

        <div className="glass-card-borderless mt-5 flex items-center justify-between rounded-3xl p-4.5 text-xs text-slate-400">
          <div>
            {total > 0 ? (
              <>
                Showing <span className="font-bold text-white">{from}</span>–
                <span className="font-bold text-white">{to}</span> of{" "}
                <span className="font-bold text-white">{total}</span> users
              </>
            ) : (
              !loading && "0 users"
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

      <UserProfileDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
