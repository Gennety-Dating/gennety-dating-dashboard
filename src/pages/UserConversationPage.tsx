import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDialog, type DialogDetail } from "../lib/api";
import DialogTranscript from "../components/dialogs/DialogTranscript";

/**
 * The full conversation for one user, reached from the Users table.
 *
 * Deliberately the SAME reader as the Dialogs page (`GET /admin/dialogs/:id` +
 * `DialogTranscript`), not the older `/admin/users/:id/conversation`. That
 * endpoint merges only two of the three stores — it cannot see `chat_events`,
 * which is where every message the bot sends from its non-agent call sites
 * lives, along with the buttons offered, the taps, the Mini App actions and
 * the media. Keeping two readers meant the same conversation looked different
 * depending on which page you opened it from, and the one linked as "full"
 * was the emptier of the two.
 */
export default function UserConversationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<{
    id: string;
    data: DialogDetail | null;
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

    getDialog(id, { limit: 500 })
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

  const participant = data?.participant;
  const title =
    participant?.displayName ?? (participant ? `tg:${participant.telegramId}` : "Conversation");

  return (
    <div className="flex h-screen flex-col bg-[#121316]">
      <header className="glass-card-borderless flex items-center gap-4 px-5 py-4">
        <Link
          to="/users"
          className="inner-glow shrink-0 rounded-2xl px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
        >
          &larr; Back to Users
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-base font-extrabold tracking-tight text-white">{title}</h1>
          {participant && (
            <p className="truncate text-xs font-medium text-rose-200/70">
              Telegram ID: {participant.telegramId}
              {participant.telegramUsername ? ` · @${participant.telegramUsername}` : ""}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6">
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-600 border-t-white" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl bg-rose-950/40 p-4 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3)]">
            {error}
          </div>
        )}

        {data && !loading && <DialogTranscript dialog={data} />}
      </main>
    </div>
  );
}
