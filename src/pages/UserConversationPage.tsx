import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUserConversation, type UserConversation } from "../lib/api";
import ConversationView from "../components/users/ConversationView";

export default function UserConversationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<{
    id: string;
    data: UserConversation | null;
    error: string;
  } | null>(null);

  // Loading is derived from the result key vs the current id (matching the
  // codebase pattern) rather than reset synchronously inside the effect.
  const loading = !!id && (result === null || result.id !== id);
  const data = result && result.id === id ? result.data : null;
  const error = result && result.id === id ? result.error : "";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getUserConversation(id)
      .then((d) => {
        if (!cancelled) setResult({ id, data: d, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setResult({ id, data: null, error: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const title = data?.displayName ?? (data ? `tg:${data.telegramId}` : "Conversation");

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 sm:px-6">
        <Link
          to="/users"
          className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          ← Users
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-white">{title}</h1>
          {data && (
            <p className="truncate text-xs text-slate-500">Telegram ID: {data.telegramId}</p>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {data && !loading && <ConversationView conversation={data} />}
      </main>
    </div>
  );
}
