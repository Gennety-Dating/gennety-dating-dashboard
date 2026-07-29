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
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/30 transition-all"
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
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:text-white hover:bg-white/5"
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
          title="User Profiles"
          description="Browse registered users and review their AI-generated psychological profiles"
        />

        {error && (
          <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-xs font-medium text-red-300 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        <UsersTable
          users={users}
          loading={loading}
          onRowClick={setSelectedUserId}
        />

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-900/40 p-4 backdrop-blur-xl ring-1 ring-white/5 text-xs text-slate-400">
          <div>
            {total > 0 ? (
              <>
                Showing <span className="font-semibold text-white">{from}</span>–
                <span className="font-semibold text-white">{to}</span> of{" "}
                <span className="font-semibold text-white">{total}</span> users
              </>
            ) : (
              !loading && "0 users"
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
              Page <span className="text-white font-medium">{page + 1}</span> / {maxPage + 1}
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

      <UserProfileDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
