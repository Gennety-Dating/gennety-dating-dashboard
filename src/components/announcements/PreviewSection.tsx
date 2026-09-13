import { useState } from "react";
import { previewAnnouncement } from "../../lib/api";
import { describeError, errorForCode, isAuthError } from "../../lib/announcements";

interface Props {
  /**
   * The id to preview. For a draft with unsaved edits this saves first, so the
   * phone shows what is on screen; it resolves `null` when that save failed
   * (the editor has already said why, under the field).
   */
  resolveId: () => Promise<string | null>;
  /** One line under the button saying what the send will use. */
  hint: string;
  onAuthError: () => void;
}

const STORAGE_KEY = "announcement_preview_user_id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A convenience only — private windows and blocked storage must not break the page. */
function readStoredUserId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeUserId(userId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, userId);
  } catch {
    // Remembering the id is a nicety; failing to is not an error worth showing.
  }
}

type Result = { kind: "sent"; pushed: boolean } | { kind: "error"; message: string };

/**
 * Send this announcement to ONE app account — the founder's own phone — before
 * everyone else's. It writes the same inbox row the fan-out would, so that
 * account is not sent a second copy later.
 */
export default function PreviewSection({ resolveId, hint, onAuthError }: Props) {
  const [userId, setUserId] = useState(readStoredUserId);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSend() {
    const trimmed = userId.trim();
    if (!UUID_RE.test(trimmed)) {
      setResult({ kind: "error", message: errorForCode("userId_invalid")?.message ?? "Invalid user id." });
      return;
    }
    storeUserId(trimmed);
    setResult(null);
    setBusy(true);
    try {
      const id = await resolveId();
      if (!id) return;
      const res = await previewAnnouncement(id, trimmed);
      setResult({ kind: "sent", pushed: res.pushed });
    } catch (err) {
      if (isAuthError(err)) {
        onAuthError();
        return;
      }
      setResult({ kind: "error", message: describeError(err, "preview").message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel rounded-lg p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">Preview on one phone</h3>
      <label
        htmlFor="announcement-preview-user"
        className="mb-1 block text-[10px] font-semibold tracking-wide text-slate-500 uppercase"
      >
        App account user id
      </label>
      {/* Stacked, not side by side: this lives in a 20rem column, where a row
          left the UUID field a few characters wide. */}
      <div className="flex flex-col items-start gap-2">
        <input
          id="announcement-preview-user"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy) void handleSend();
          }}
          placeholder="00000000-0000-0000-0000-000000000000"
          spellCheck={false}
          className="w-full rounded-md border border-white/10 bg-canvas px-3 py-2 font-mono text-xs text-white placeholder:text-slate-600 outline-none focus:border-white/30"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={busy}
          className="btn cursor-pointer rounded-md px-3 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send preview to this account"}
        </button>
      </div>

      {result?.kind === "error" && (
        <p role="alert" className="mt-2 text-[11px] text-rose-300">
          {result.message}
        </p>
      )}
      {result?.kind === "sent" &&
        (result.pushed ? (
          <p role="status" className="mt-2 text-[11px] text-emerald-300">
            Sent — the push is on its way and the item is in that account's inbox.
          </p>
        ) : (
          <p role="status" className="mt-2 text-[11px] text-amber-300/90">
            In that account's inbox, but no push went out — it has no push token, or APNs refused it. Open the
            bell in the app to see it.
          </p>
        ))}
      {!result && (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          {hint} The account must be on the iOS app; its id ends the address of its page under Users
          (/users/…).
        </p>
      )}
    </section>
  );
}
