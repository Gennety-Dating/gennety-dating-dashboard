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
              className="border-l border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
            >
              Users
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
          title="User Profiles"
          description="Browse registered users and review their AI-generated psychological profiles"
        />

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <UsersTable
          users={users}
          loading={loading}
          onRowClick={setSelectedUserId}
        />

        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <div>
            {total > 0 ? (
              <>
                Showing <span className="text-slate-200">{from}</span>–
                <span className="text-slate-200">{to}</span> of{" "}
                <span className="text-slate-200">{total}</span>
              </>
            ) : (
              !loading && "0 users"
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

      <UserProfileDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
