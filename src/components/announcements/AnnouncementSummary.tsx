import { useState, type ReactNode } from "react";
import {
  archiveAnnouncement,
  unscheduleAnnouncement,
  type AdminAnnouncement,
} from "../../lib/api";
import {
  LANGUAGE_LABEL,
  STALE_CODES,
  describeError,
  errorCode,
  formatCount,
  formatDateTime,
  isAuthError,
  useAudienceCount,
  type EventsState,
} from "../../lib/announcements";
import ErrorBanner from "../ErrorBanner";
import StatCard from "../StatCard";
import MediaSection from "./MediaSection";
import PreviewSection from "./PreviewSection";
import StatusPill from "./StatusPill";

/**
 * A scheduled, sending, sent or archived announcement. Read-only by design:
 * once the worker can claim a row, what people read is what was scheduled, and
 * an edit would make two people's inboxes disagree about the same message.
 * Unscheduling (back to a draft) is the way to change one that has not gone out.
 */

interface Props {
  announcement: AdminAnnouncement;
  events: EventsState;
  onUpdated: (announcement: AdminAnnouncement) => void;
  onStale: () => void;
  onAuthError: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 text-xs leading-relaxed text-slate-200">{children}</dd>
    </div>
  );
}

function statusLine(a: AdminAnnouncement): string {
  switch (a.status) {
    case "scheduled":
      return `Goes out ${formatDateTime(a.scheduledAt)} — the worker picks it up within a minute of that.`;
    case "sending":
      return "Delivering. Inbox rows are written first, then pushes at about 10 a second; pushes pause 23:00–09:00 Kyiv.";
    // A sent one needs no sentence: the stat cards below already say when and to whom.
    case "archived":
      return "Archived. What people were sent stays in their inboxes.";
    default:
      return "";
  }
}

export default function AnnouncementSummary({ announcement: a, events, onUpdated, onStale, onAuthError }: Props) {
  const [busy, setBusy] = useState<"unschedule" | "archive" | null>(null);
  const [error, setError] = useState("");
  // Only a scheduled announcement still has an audience to count — once sending
  // starts, `recipientCount` is the kept promise and a fresh count would differ.
  const liveCount = useAudienceCount(a.audience, a.status === "scheduled");

  function run(action: "unschedule" | "archive") {
    const prompt =
      action === "unschedule"
        ? "Unschedule this announcement? It goes back to a draft and nothing is sent."
        : "Archive this announcement? It leaves the active list. What people were sent stays in their inboxes.";
    if (!window.confirm(prompt)) return;
    setError("");
    setBusy(action);
    const call = action === "unschedule" ? unscheduleAnnouncement(a.id) : archiveAnnouncement(a.id);
    call
      .then((res) => onUpdated(res.announcement))
      .catch((err: unknown) => {
        if (isAuthError(err)) {
          onAuthError();
          return;
        }
        setError(describeError(err, "general").message);
        const code = errorCode(err);
        if (code && STALE_CODES.has(code)) onStale();
      })
      .finally(() => setBusy(null));
  }

  const event =
    a.eventId && events.status === "ready" ? events.events.find((e) => e.id === a.eventId) : undefined;
  const readPct =
    a.recipientCount && a.recipientCount > 0 ? Math.round((a.readCount / a.recipientCount) * 100) : null;

  const cities = a.audience.cityKeys ?? [];
  const languages = a.audience.languages ?? [];

  return (
    <div className="space-y-5">
      <div className="panel rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <StatusPill status={a.status} />
              <span className="text-[11px] text-slate-500">Created {formatDateTime(a.createdAt)}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-white">{a.title}</h3>
            {statusLine(a) && <p className="mt-1 text-xs text-slate-400">{statusLine(a)}</p>}
          </div>
          <div className="flex gap-2">
            {a.status === "scheduled" && (
              <button
                type="button"
                onClick={() => run("unschedule")}
                disabled={busy !== null}
                className="btn cursor-pointer rounded-md px-3 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "unschedule" ? "Unscheduling…" : "Unschedule"}
              </button>
            )}
            {a.status === "sent" && (
              <button
                type="button"
                onClick={() => run("archive")}
                disabled={busy !== null}
                className="btn cursor-pointer rounded-md px-3 py-2 text-[11px] font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "archive" ? "Archiving…" : "Archive"}
              </button>
            )}
          </div>
        </div>
        {error && <ErrorBanner className="mt-3" message={error} />}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {a.status === "scheduled" ? (
          <StatCard
            label="Audience now"
            value={
              liveCount.status === "ready"
                ? formatCount(liveCount.count)
                : liveCount.status === "loading" && liveCount.previous !== null
                  ? formatCount(liveCount.previous)
                  : "—"
            }
            sub={liveCount.status === "error" ? liveCount.message : "people it would reach today"}
            info="Counted live. The real recipient list is taken when the worker starts sending, so people who join or leave before then change it."
          />
        ) : (
          <StatCard
            label="Recipients"
            value={a.recipientCount === null ? "—" : formatCount(a.recipientCount)}
            sub={a.recipientCount === null ? "counted when sending finishes" : "inbox rows written"}
          />
        )}
        <StatCard
          label="Read"
          value={formatCount(a.readCount)}
          sub={readPct === null ? "opened in the app" : `${readPct}% of recipients`}
        />
        <StatCard
          label="Pushes pending"
          value={a.sendPush ? formatCount(a.pendingPushCount) : "—"}
          sub={
            !a.sendPush
              ? "push off — inbox only"
              : a.status === "sending"
                ? "still to go out — held 23:00–09:00 Kyiv"
                : a.status === "scheduled"
                  ? "pushes start when it goes out"
                  : a.pendingPushCount === 0
                    ? "every push done"
                    : "never pushed"
          }
        />
        <StatCard
          label={a.status === "scheduled" ? "Goes out" : "Sent"}
          value={formatDateTime(a.status === "scheduled" ? a.scheduledAt : a.sentAt)}
          sub={a.status === "sending" ? `started ${formatDateTime(a.scheduledAt)}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="panel rounded-lg px-5 py-2">
          <dl className="divide-y divide-white/5">
            <Row label="Teaser">{a.teaser}</Row>
            <Row label="Body">
              <p className="whitespace-pre-wrap">{a.body}</p>
            </Row>
            <Row label="Agent brief">
              {a.agentBrief ? (
                <p className="whitespace-pre-wrap text-slate-300">{a.agentBrief}</p>
              ) : (
                <span className="text-slate-500">None</span>
              )}
            </Row>
            <Row label="Questions">
              {a.suggestedQuestions.length > 0 ? (
                <ul className="space-y-1">
                  {a.suggestedQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500">None</span>
              )}
            </Row>
            {a.eventId && (
              <Row label="Event">
                {event ? `${event.title} · ${event.cityKey} · ${event.status}` : `Event ${a.eventId}`}
              </Row>
            )}
            <Row label="Audience">
              {cities.length === 0 && languages.length === 0
                ? "Every app user in status active or paused"
                : [
                    cities.length > 0 ? `Cities: ${cities.join(", ")}` : "Every city",
                    languages.length > 0
                      ? `Languages: ${languages.map((l) => LANGUAGE_LABEL[l] ?? l).join(", ")}`
                      : "every language",
                  ].join(" · ")}
            </Row>
            <Row label="Push">{a.sendPush ? "On" : "Off — inbox only"}</Row>
          </dl>
        </section>

        <div className="space-y-5">
          <MediaSection
            announcement={a}
            editable={false}
            onUpdated={onUpdated}
            onStale={onStale}
            onAuthError={onAuthError}
          />
          {a.status === "scheduled" && (
            <PreviewSection
              resolveId={() => Promise.resolve(a.id)}
              hint="Sends the scheduled version."
              onAuthError={onAuthError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
