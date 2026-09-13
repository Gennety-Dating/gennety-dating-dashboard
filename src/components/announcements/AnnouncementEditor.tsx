import { useEffect, useState } from "react";
import {
  ANNOUNCEMENT_LANGUAGES,
  ANNOUNCEMENT_LIMITS,
  archiveAnnouncement,
  createAnnouncement,
  scheduleAnnouncement,
  updateAnnouncement,
  type AdminAnnouncement,
  type AdminEventSummary,
  type AnnouncementInput,
  type AnnouncementLanguage,
  type CityCatalogEntry,
} from "../../lib/api";
import {
  FIELD_LABEL,
  LANGUAGE_LABEL,
  STALE_CODES,
  describeError,
  errorCode,
  errorForCode,
  formatDateTime,
  inKyivQuietHours,
  isAuthError,
  localInputToIso,
  normalizeAudience,
  people,
  useAudienceCount,
  type AnnouncementError,
  type AnnouncementErrorField,
  type EventsState,
} from "../../lib/announcements";
import ErrorBanner from "../ErrorBanner";
import CityKeysInput from "./CityKeysInput";
import Field from "./Field";
import MediaSection from "./MediaSection";
import PreviewSection from "./PreviewSection";
import StatusPill from "./StatusPill";

/**
 * Compose or edit one DRAFT announcement.
 *
 * The caller remounts this with a new `key` whenever a different announcement
 * is opened, so the form is initialised once per mount instead of being synced
 * from props in an effect. Saving a brand-new draft keeps the same key: the
 * page swaps `announcement` from `null` to the created row underneath a form
 * that is still being worked on.
 *
 * Preview and Schedule both act on the SAVED row, so both save unsaved edits
 * first — otherwise the founder's phone, or everyone's, would show a version
 * that is no longer on screen.
 */

const L = ANNOUNCEMENT_LIMITS;

interface FormState {
  title: string;
  teaser: string;
  body: string;
  agentBrief: string;
  suggestedQuestions: string[];
  /** `""` = no event. */
  eventId: string;
  cityKeys: string[];
  languages: AnnouncementLanguage[];
  sendPush: boolean;
}

function formFrom(a: AdminAnnouncement | null): FormState {
  return {
    title: a?.title ?? "",
    teaser: a?.teaser ?? "",
    body: a?.body ?? "",
    agentBrief: a?.agentBrief ?? "",
    suggestedQuestions: a?.suggestedQuestions ?? [],
    eventId: a?.eventId ?? "",
    cityKeys: a?.audience.cityKeys ?? [],
    languages: a?.audience.languages ?? [],
    sendPush: a?.sendPush ?? true,
  };
}

/** Exactly what the server will store — trimmed, empties dropped — so dirtiness compares like with like. */
function toInput(f: FormState): Required<AnnouncementInput> {
  return {
    title: f.title.trim(),
    teaser: f.teaser.trim(),
    body: f.body.trim(),
    agentBrief: f.agentBrief.trim() || null,
    suggestedQuestions: f.suggestedQuestions.map((q) => q.trim()).filter(Boolean),
    eventId: f.eventId || null,
    audience: normalizeAudience(f.cityKeys, f.languages),
    sendPush: f.sendPush,
  };
}

function known(code: string): AnnouncementError {
  return errorForCode(code) ?? { field: "general", message: code };
}

/** The server's own rules, run first so a doomed save does not spend a request. */
function validate(f: FormState): AnnouncementError | null {
  const input = toInput(f);
  if (!input.title) return known("title_required");
  if (input.title.length > L.title) return known("title_too_long");
  if (!input.teaser) return known("teaser_required");
  if (input.teaser.length > L.teaser) return known("teaser_too_long");
  if (!input.body) return known("body_required");
  if (input.body.length > L.body) return known("body_too_long");
  if ((input.agentBrief?.length ?? 0) > L.agentBrief) return known("agentBrief_too_long");
  if (input.suggestedQuestions.length > L.suggestedQuestions) return known("suggestedQuestions_invalid");
  if (input.suggestedQuestions.some((q) => q.length > L.suggestedQuestion)) return known("suggestedQuestions_too_long");
  return null;
}

type FieldErrors = Partial<Record<AnnouncementErrorField, string>>;

/** The event's own calendar day, in its own zone — "Friday in Kyiv", not the admin's laptop's Friday. */
function eventDate(ev: AdminEventSummary): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  try {
    return new Date(ev.startsAt).toLocaleDateString(undefined, { ...options, timeZone: ev.timeZone });
  } catch {
    return new Date(ev.startsAt).toLocaleDateString(undefined, options);
  }
}

/** A field error, plus a pointer to it beside the buttons — Title is a long scroll from Save. */
function errorsFor(e: AnnouncementError): FieldErrors {
  if (e.field === "general" || e.field === "schedule") return { [e.field]: e.message };
  return { [e.field]: e.message, general: `${FIELD_LABEL[e.field]}: ${e.message}` };
}

type Busy = "save" | "schedule" | "archive" | null;

interface Props {
  /** `null` = a new announcement that has never been saved. */
  announcement: AdminAnnouncement | null;
  events: EventsState;
  cities: CityCatalogEntry[];
  onSaved: (announcement: AdminAnnouncement) => void;
  onDirtyChange: (dirty: boolean) => void;
  onStale: () => void;
  onAuthError: () => void;
}

const INPUT =
  "w-full rounded-md border bg-canvas px-3 py-2 text-xs font-medium text-white placeholder:text-slate-600 outline-none focus:border-white/30";

function inputBorder(error: string | undefined): string {
  return error ? "border-rose-500/50" : "border-white/10";
}

export default function AnnouncementEditor({
  announcement,
  events,
  cities,
  onSaved,
  onDirtyChange,
  onStale,
  onAuthError,
}: Props) {
  const [form, setForm] = useState<FormState>(() => formFrom(announcement));
  // What the server last accepted. Dirtiness is measured against this, not
  // against `announcement`, which also changes on media uploads.
  const [baseline, setBaseline] = useState<FormState>(() => formFrom(announcement));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState<Busy>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const input = toInput(form);
  // For a new announcement the baseline is the empty form, so an untouched
  // "New announcement" is not "unsaved" and can be left without a prompt.
  const dirty = JSON.stringify(input) !== JSON.stringify(toInput(baseline));
  const count = useAudienceCount(input.audience, true);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  // Closing the tab on unsaved copy loses it; the browser's own prompt is the honest guard.
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    const field: AnnouncementErrorField =
      key === "cityKeys" || key === "languages" ? "audience" : (key as AnnouncementErrorField);
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  }

  function fail(err: unknown, fallback: AnnouncementErrorField) {
    if (isAuthError(err)) {
      onAuthError();
      return;
    }
    setErrors(errorsFor(describeError(err, fallback)));
    const code = errorCode(err);
    if (code && STALE_CODES.has(code)) onStale();
  }

  /** Save if there is anything to save. Throws API errors; returns `null` on a local validation failure. */
  async function persist(): Promise<AdminAnnouncement | null> {
    const problem = validate(form);
    if (problem) {
      setErrors(errorsFor(problem));
      return null;
    }
    if (announcement && !dirty) return announcement;
    const snapshot = form;
    const body = toInput(snapshot);
    const res = announcement
      ? await updateAnnouncement(announcement.id, body)
      : await createAnnouncement(body);
    setBaseline(snapshot);
    onSaved(res.announcement);
    return res.announcement;
  }

  function handleSave() {
    setErrors({});
    setBusy("save");
    persist()
      .catch((err: unknown) => fail(err, "general"))
      .finally(() => setBusy(null));
  }

  async function resolveForPreview(): Promise<string | null> {
    setErrors({});
    // Marked busy like Save: a Create click landing mid-way would otherwise make a second draft.
    setBusy("save");
    try {
      return (await persist())?.id ?? null;
    } catch (err) {
      fail(err, "general");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handleSchedule() {
    setErrors({});
    const iso = localInputToIso(scheduleAt);
    if (scheduleAt && !iso) {
      setErrors({ schedule: known("scheduledAt_invalid").message });
      return;
    }
    const problem = validate(form);
    if (problem) {
      setErrors(errorsFor(problem));
      return;
    }

    const at = iso ? new Date(iso) : null;
    const later = at !== null && at.getTime() > Date.now();
    const who =
      count.status === "ready"
        ? people(count.count)
        : "everyone in this audience (the count could not be loaded)";
    const lines = [
      later
        ? `Schedule "${input.title}" for ${who} on ${at.toLocaleString()}?`
        : `Send "${input.title}" to ${who} now?`,
    ];
    if (at && !later) lines.push("The time you picked has already passed, so it goes out now.");
    if (count.status === "ready" && count.count === 0) {
      lines.push("This audience is empty right now — nobody would receive it.");
    }
    lines.push(
      input.sendPush
        ? "It lands in inboxes at once. Pushes go out at about 10 a second and wait for 09:00 Kyiv during quiet hours (23:00–09:00)."
        : "Push is off: it lands in inboxes silently.",
    );
    if (!announcement) lines.push("The draft is created first.");
    else if (dirty) lines.push("Your unsaved edits are saved first.");
    if (!window.confirm(lines.join("\n\n"))) return;

    setBusy("schedule");
    try {
      const saved = await persist();
      if (!saved) return;
      const res = await scheduleAnnouncement(saved.id, later && iso ? iso : undefined);
      onSaved(res.announcement);
    } catch (err) {
      fail(err, "schedule");
    } finally {
      setBusy(null);
    }
  }

  function handleArchive() {
    if (!announcement) return;
    const note = dirty ? "\n\nUnsaved edits are discarded." : "";
    if (!window.confirm(`Archive this draft? Nothing is sent; it leaves the active list.${note}`)) return;
    setErrors({});
    setBusy("archive");
    archiveAnnouncement(announcement.id)
      .then((res) => onSaved(res.announcement))
      .catch((err: unknown) => fail(err, "general"))
      .finally(() => setBusy(null));
  }

  /** A media change answers any poster/media complaint from the last schedule attempt. */
  function handleMediaUpdated(a: AdminAnnouncement) {
    setErrors((prev) =>
      prev.poster || prev.media ? { ...prev, poster: undefined, media: undefined, general: undefined } : prev,
    );
    onSaved(a);
  }

  function setQuestion(index: number, value: string) {
    update(
      "suggestedQuestions",
      form.suggestedQuestions.map((q, i) => (i === index ? value : q)),
    );
  }

  const scheduleLabel = (() => {
    const target = scheduleAt ? "Schedule for" : "Send to";
    if (count.status === "ready") return `${target} ${people(count.count)}`;
    if (count.status === "loading") {
      return count.previous === null ? "Counting audience…" : `${target} ${people(count.previous)}…`;
    }
    return scheduleAt ? "Schedule" : "Send now";
  })();

  const pickedAt = scheduleAt ? localInputToIso(scheduleAt) : null;
  const quietWarning = input.sendPush && pickedAt !== null && inKyivQuietHours(new Date(pickedAt));

  const eventList = events.status === "ready" ? events.events : [];
  const eventMissing = form.eventId !== "" && !eventList.some((e) => e.id === form.eventId);

  return (
    <div className="space-y-5">
      {/* ── Action bar ─────────────────────────────────────────── */}
      <div className="panel sticky top-2 z-10 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <StatusPill status="draft" />
            <span className="truncate text-xs font-medium text-slate-400">
              {announcement ? `Created ${formatDateTime(announcement.createdAt)}` : "New announcement"}
            </span>
            {dirty && announcement && (
              <span className="shrink-0 text-[11px] font-medium text-amber-300/90">Unsaved changes</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {announcement && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={busy !== null}
                className="btn cursor-pointer rounded-md px-3 py-2 text-[11px] font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "archive" ? "Archiving…" : "Archive"}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={busy !== null || (announcement !== null && !dirty)}
              className="btn cursor-pointer rounded-md px-3 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "save" ? "Saving…" : announcement ? "Save draft" : "Create draft"}
            </button>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => {
                setScheduleAt(e.target.value);
                if (errors.schedule) setErrors((prev) => ({ ...prev, schedule: undefined }));
              }}
              aria-label="Send later (optional, your local time)"
              title="Send later (optional, your local time). Empty = now."
              className="rounded-md border border-white/10 bg-canvas px-2.5 py-1.5 text-xs font-medium text-white outline-none focus:border-white/30"
            />
            {scheduleAt && (
              <button
                type="button"
                onClick={() => setScheduleAt("")}
                className="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-slate-300"
              >
                Now instead
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleSchedule()}
              // Disabled while counting, so the confirmation always names the
              // number for the audience on screen, not the one before the last edit.
              disabled={busy !== null || count.status === "loading"}
              className="btn-primary cursor-pointer rounded-md px-4 py-2 text-xs font-semibold text-white tabular-nums disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "schedule" ? "Scheduling…" : scheduleLabel}
            </button>
          </div>
        </div>

        {(errors.general || errors.schedule) && (
          <ErrorBanner className="mt-3" message={errors.general ?? errors.schedule ?? ""} />
        )}
        {quietWarning && (
          <p className="mt-2 text-[11px] text-amber-300/90">
            That time is inside quiet hours (23:00–09:00 Kyiv): inbox rows land then, pushes wait until 09:00.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {/* ── Copy ───────────────────────────────────────────── */}
          <section className="panel space-y-4 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white">Copy</h3>
            <Field
              label="Title"
              htmlFor="announcement-title"
              count={{ length: input.title.length, max: L.title }}
              hint="Push title and the capsule headline."
              error={errors.title}
            >
              <input
                id="announcement-title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Launch party in Kyiv this Friday"
                className={`${INPUT} ${inputBorder(errors.title)}`}
              />
            </Field>
            <Field
              label="Teaser"
              htmlFor="announcement-teaser"
              count={{ length: input.teaser.length, max: L.teaser }}
              hint="Push body and the capsule subline."
              error={errors.teaser}
            >
              <textarea
                id="announcement-teaser"
                rows={2}
                value={form.teaser}
                onChange={(e) => update("teaser", e.target.value)}
                className={`${INPUT} resize-y ${inputBorder(errors.teaser)}`}
              />
            </Field>
            <Field
              label="Body"
              htmlFor="announcement-body"
              count={{ length: input.body.length, max: L.body }}
              hint="The detail sheet a tap opens."
              error={errors.body}
            >
              <textarea
                id="announcement-body"
                rows={9}
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                className={`${INPUT} resize-y leading-relaxed ${inputBorder(errors.body)}`}
              />
            </Field>
          </section>

          {/* ── Agent ──────────────────────────────────────────── */}
          <section className="panel space-y-4 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white">Agent</h3>
            <Field
              label="Agent brief"
              htmlFor="announcement-brief"
              count={{ length: (input.agentBrief ?? "").length, max: L.agentBrief }}
              hint="Facts only, for the AI agent answering questions about this — dress code, entry rules, what to bring. Never shown to people verbatim."
              error={errors.agentBrief}
            >
              <textarea
                id="announcement-brief"
                rows={5}
                value={form.agentBrief}
                onChange={(e) => update("agentBrief", e.target.value)}
                className={`${INPUT} resize-y leading-relaxed ${inputBorder(errors.agentBrief)}`}
              />
            </Field>

            <div>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                  Suggested questions
                </span>
                <span className="text-[10px] font-medium text-slate-500 tabular-nums">
                  {form.suggestedQuestions.length}/{L.suggestedQuestions}
                </span>
              </div>
              <div className="space-y-2">
                {form.suggestedQuestions.map((q, i) => {
                  const over = q.trim().length > L.suggestedQuestion;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="relative min-w-0 flex-1">
                        <input
                          value={q}
                          onChange={(e) => setQuestion(i, e.target.value)}
                          aria-label={`Suggested question ${i + 1}`}
                          placeholder="What's the dress code?"
                          className={`${INPUT} pr-14 ${over ? "border-rose-500/50" : "border-white/10"}`}
                        />
                        <span
                          className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] tabular-nums ${
                            over ? "text-rose-300" : "text-slate-500"
                          }`}
                        >
                          {q.trim().length}/{L.suggestedQuestion}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "suggestedQuestions",
                            form.suggestedQuestions.filter((_, j) => j !== i),
                          )
                        }
                        aria-label={`Remove question ${i + 1}`}
                        className="btn cursor-pointer rounded-md px-2.5 py-2 text-[11px] font-semibold text-slate-400"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
              {form.suggestedQuestions.length < L.suggestedQuestions && (
                <button
                  type="button"
                  onClick={() => update("suggestedQuestions", [...form.suggestedQuestions, ""])}
                  className={`btn cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold ${
                    form.suggestedQuestions.length > 0 ? "mt-2" : ""
                  }`}
                >
                  Add question
                </button>
              )}
              {errors.suggestedQuestions ? (
                <p role="alert" className="mt-1 text-[11px] text-rose-300">
                  {errors.suggestedQuestions}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-500">
                  Tappable under the chat chip; a tap sends the question to the agent. Empty rows are dropped.
                </p>
              )}
            </div>

            {events.status !== "off" && (
              <Field
                label="Event"
                htmlFor="announcement-event"
                hint={
                  events.status === "error"
                    ? `Events could not be loaded (${events.message}). The current link is kept.`
                    : "Links the announcement to a launch event, so the agent knows its venue and start time."
                }
                error={errors.eventId}
              >
                <select
                  id="announcement-event"
                  value={form.eventId}
                  onChange={(e) => update("eventId", e.target.value)}
                  disabled={events.status !== "ready"}
                  className={`${INPUT} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${inputBorder(errors.eventId)}`}
                >
                  <option value="">{events.status === "loading" ? "Loading events…" : "No event"}</option>
                  {eventMissing && <option value={form.eventId}>Linked event {form.eventId.slice(0, 8)}…</option>}
                  {eventList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} · {ev.cityKey} · {eventDate(ev)} · {ev.status}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </section>
        </div>

        <div className="space-y-5">
          {/* ── Audience ───────────────────────────────────────── */}
          <section className="panel space-y-4 rounded-lg p-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Audience</h3>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white tabular-nums">
                {count.status === "ready"
                  ? people(count.count)
                  : count.status === "loading" && count.previous !== null
                    ? people(count.previous)
                    : "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {count.status === "loading"
                  ? "Counting…"
                  : count.status === "error"
                    ? count.message
                    : "App users in status active or paused, right now."}
              </p>
            </div>

            <Field label="Cities" htmlFor="announcement-cities" error={errors.audience} hint="Empty = every city.">
              <CityKeysInput
                id="announcement-cities"
                value={form.cityKeys}
                onChange={(next) => update("cityKeys", next)}
                catalog={cities}
                invalid={!!errors.audience}
              />
            </Field>

            <div>
              <span className="mb-1.5 block text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Languages
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ANNOUNCEMENT_LANGUAGES.map((lang) => (
                  <label
                    key={lang}
                    className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-300 select-none hover:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={form.languages.includes(lang)}
                      onChange={(e) =>
                        update(
                          "languages",
                          e.target.checked
                            ? [...form.languages, lang]
                            : form.languages.filter((l) => l !== lang),
                        )
                      }
                      className="h-3.5 w-3.5 cursor-pointer accent-slate-400"
                    />
                    {LANGUAGE_LABEL[lang]}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">None ticked = every language.</p>
            </div>

            <div className="border-t border-white/5 pt-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={form.sendPush}
                  onChange={(e) => update("sendPush", e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer accent-slate-400"
                />
                Send a push notification
              </label>
              {errors.sendPush ? (
                <p role="alert" className="mt-1 text-[11px] text-rose-300">
                  {errors.sendPush}
                </p>
              ) : (
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  {form.sendPush
                    ? "About 10 a second, held 23:00–09:00 Kyiv. Inbox rows land immediately either way."
                    : "Off: it lands in the inbox silently."}
                </p>
              )}
            </div>
          </section>

          <MediaSection
            announcement={announcement}
            editable
            posterError={errors.poster}
            onUpdated={handleMediaUpdated}
            onStale={onStale}
            onAuthError={onAuthError}
          />

          <PreviewSection
            resolveId={resolveForPreview}
            hint={
              !announcement
                ? "The draft is created first."
                : dirty
                  ? "Unsaved edits are saved first."
                  : "Sends the saved draft."
            }
            onAuthError={onAuthError}
          />
        </div>
      </div>
    </div>
  );
}
