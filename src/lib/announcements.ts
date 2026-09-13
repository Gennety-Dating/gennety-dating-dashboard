import { useEffect, useState } from "react";
import {
  ANNOUNCEMENT_LIMITS,
  ANNOUNCEMENT_MEDIA,
  countAnnouncementAudience,
  type AnnouncementAudience,
  type AnnouncementLanguage,
  type AnnouncementStatus,
  type AdminEventSummary,
  type ApiErrorDetails,
} from "./api";

/**
 * Everything the announcement composer needs that is not markup: which field a
 * backend error code belongs under and how to say it, the datetime-local ↔ ISO
 * conversion, and the debounced live audience count.
 */

/** Where an error is shown. `general` sits beside the action that failed. */
export type AnnouncementErrorField =
  | "title"
  | "teaser"
  | "body"
  | "agentBrief"
  | "suggestedQuestions"
  | "eventId"
  | "audience"
  | "sendPush"
  | "media"
  | "poster"
  | "preview"
  | "schedule"
  | "general";

export interface AnnouncementError {
  field: AnnouncementErrorField;
  message: string;
}

export const FIELD_LABEL: Record<AnnouncementErrorField, string> = {
  title: "Title",
  teaser: "Teaser",
  body: "Body",
  agentBrief: "Agent brief",
  suggestedQuestions: "Suggested questions",
  eventId: "Event",
  audience: "Audience",
  sendPush: "Push",
  media: "Media",
  poster: "Poster",
  preview: "Preview",
  schedule: "Schedule",
  general: "",
};

const L = ANNOUNCEMENT_LIMITS;

const CODES: Record<string, AnnouncementError> = {
  title_required: { field: "title", message: "Title is required." },
  title_too_long: { field: "title", message: `Title must be ${L.title} characters or fewer.` },
  title_invalid: { field: "title", message: "Title must be text." },
  teaser_required: { field: "teaser", message: "Teaser is required." },
  teaser_too_long: { field: "teaser", message: `Teaser must be ${L.teaser} characters or fewer.` },
  teaser_invalid: { field: "teaser", message: "Teaser must be text." },
  body_required: { field: "body", message: "Body is required." },
  body_too_long: { field: "body", message: `Body must be ${L.body.toLocaleString("en-US")} characters or fewer.` },
  body_invalid: { field: "body", message: "Body must be text." },
  agentBrief_too_long: {
    field: "agentBrief",
    message: `Agent brief must be ${L.agentBrief.toLocaleString("en-US")} characters or fewer.`,
  },
  agentBrief_invalid: { field: "agentBrief", message: "Agent brief must be text." },
  suggestedQuestions_invalid: {
    field: "suggestedQuestions",
    message: `At most ${L.suggestedQuestions} suggested questions.`,
  },
  suggestedQuestions_too_long: {
    field: "suggestedQuestions",
    message: `Each suggested question must be ${L.suggestedQuestion} characters or fewer.`,
  },
  eventId_invalid: { field: "eventId", message: "That event id is not valid." },
  event_not_found: { field: "eventId", message: "That event no longer exists — pick another one or none." },
  audience_invalid: {
    field: "audience",
    message: "City keys must be lowercase letters, digits, - or _ (at most 50), and languages en, ru, uk, de or pl.",
  },
  sendPush_invalid: { field: "sendPush", message: "The push setting must be on or off." },
  not_a_draft: {
    field: "general",
    message: "This is no longer a draft — it was scheduled or sent from somewhere else. Reloaded.",
  },
  not_scheduled: {
    field: "general",
    message: "It is no longer scheduled — the worker has probably started sending. Reloaded.",
  },
  cannot_archive: { field: "general", message: "Only drafts and sent announcements can be archived." },
  video_needs_poster: { field: "poster", message: "A video needs a poster image before it can be scheduled." },
  image_too_large: { field: "media", message: "Images must be 2 MB or smaller." },
  video_too_large: { field: "media", message: "Videos must be 8 MB or smaller." },
  video_too_long: {
    field: "media",
    message: `Videos must be ${ANNOUNCEMENT_MEDIA.videoMaxSeconds} seconds or shorter.`,
  },
  unsupported_media: { field: "media", message: "Use a JPEG, PNG or WebP image, or an MP4 video." },
  poster_must_be_image: { field: "poster", message: "The poster must be a JPEG, PNG or WebP image." },
  storage_unavailable: { field: "media", message: "Media storage is unavailable right now. Try again in a minute." },
  LIMIT_FILE_SIZE: { field: "media", message: "That file is over the 8 MB upload limit." },
  file_required: { field: "media", message: "Choose a file to upload." },
  role_invalid: { field: "media", message: "The upload was not marked as media or poster." },
  user_not_on_app: {
    field: "preview",
    message: "That account is not on the iOS app, so it has no inbox to preview in.",
  },
  userId_invalid: { field: "preview", message: "Paste the account's user id — a UUID, the end of its /users/… address." },
  scheduledAt_invalid: { field: "schedule", message: "That send time is not a valid date." },
  not_found: { field: "general", message: "This announcement no longer exists." },
};

/** Codes after which the row on screen is known to be stale and must be re-read. */
export const STALE_CODES = new Set(["not_a_draft", "not_scheduled", "cannot_archive", "not_found"]);

/** The error a code maps to, or `null` for a code this page does not know. */
export function errorForCode(code: string): AnnouncementError | null {
  return CODES[code] ?? null;
}

/** True when the session is gone and the caller should go to /login instead. */
export function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : "";
  return msg === "Invalid API key" || msg === "Not authenticated";
}

export function errorCode(err: unknown): string | undefined {
  return (err as ApiErrorDetails | null)?.code;
}

/**
 * Turn any thrown value into something a person can act on. `fallbackField`
 * is where an unrecognised failure is shown — beside the action that caused it.
 */
export function describeError(err: unknown, fallbackField: AnnouncementErrorField): AnnouncementError {
  const { status, code } = (err as ApiErrorDetails | null) ?? {};
  if (code) {
    const known = errorForCode(code);
    if (known) return known;
    return { field: fallbackField, message: `The server refused this (${code}).` };
  }
  if (status === 404) {
    return {
      field: fallbackField,
      message: "This server does not have the announcements API yet — the backend deploy has not landed.",
    };
  }
  if (status === 413) return { field: fallbackField, message: "That request is too large for the server." };
  if (status === 429) {
    return { field: fallbackField, message: "Too many admin requests this minute. Wait a moment and try again." };
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return {
    field: fallbackField,
    message: message === "Failed to fetch" ? "Could not reach the server." : message,
  };
}

// ── Status ──────────────────────────────────────────────────────

export const STATUS_LABEL: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
  archived: "Archived",
};

/** Colour is a status channel on this dashboard, never chrome. */
export const STATUS_STYLE: Record<AnnouncementStatus, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  scheduled: "bg-amber-500/15 text-amber-300",
  sending: "bg-sky-500/15 text-sky-300",
  sent: "bg-emerald-500/15 text-emerald-300",
  archived: "bg-white/5 text-slate-500",
};

export const LANGUAGE_LABEL: Record<AnnouncementLanguage, string> = {
  en: "English",
  ru: "Russian",
  uk: "Ukrainian",
  de: "German",
  pl: "Polish",
};

/** Same rule the server applies (`CITY_KEY_RE`). */
export const CITY_KEY_RE = /^[a-z0-9_-]{2,64}$/;
export const MAX_CITY_KEYS = 50;

// ── Formatting ──────────────────────────────────────────────────

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function people(n: number): string {
  return `${formatCount(n)} ${n === 1 ? "person" : "people"}`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * `datetime-local` value → ISO instant. The input has no zone; the spec parses
 * a zone-less date-time string as LOCAL time, which is exactly what the founder
 * typed. Empty or unparseable → `null`.
 */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const KYIV_HOUR = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Kyiv",
  hour: "numeric",
  hourCycle: "h23",
});

/** The worker holds pushes 23:00–09:00 Kyiv; inbox rows land regardless. */
export function inKyivQuietHours(at: Date): boolean {
  const hour = Number(KYIV_HOUR.format(at));
  return hour >= 23 || hour < 9;
}

// ── Audience ────────────────────────────────────────────────────

/** Drops empty lists so `{}` means everyone, as the server stores it. */
export function normalizeAudience(cityKeys: string[], languages: AnnouncementLanguage[]): AnnouncementAudience {
  const audience: AnnouncementAudience = {};
  if (cityKeys.length > 0) audience.cityKeys = cityKeys;
  if (languages.length > 0) {
    // Stable order, so the debounce key does not change when only the click order did.
    audience.languages = [...languages].sort();
  }
  return audience;
}

export type AudienceCountState =
  | { status: "idle" }
  /** `previous` = the last count for an earlier audience, so the number does not blink out while re-asking. */
  | { status: "loading"; previous: number | null }
  | { status: "ready"; count: number }
  | { status: "error"; message: string };

/** What the launch-event picker can offer. `off` = the server's events flag is off (404): hide the picker. */
export type EventsState =
  | { status: "loading" }
  | { status: "off" }
  | { status: "error"; message: string }
  | { status: "ready"; events: AdminEventSummary[] };

const COUNT_DEBOUNCE_MS = 500;

/**
 * Live "how many people will this reach", re-asked 500 ms after the audience
 * stops changing. Debounced rather than per keystroke: the whole admin surface
 * shares a 60-requests-a-minute limit.
 *
 * Loading is DERIVED (result key vs current key), so the effect only ever sets
 * state inside its timer callback.
 */
export function useAudienceCount(audience: AnnouncementAudience, enabled: boolean): AudienceCountState {
  const key = JSON.stringify(audience);
  const [result, setResult] = useState<{ key: string; count: number | null; error: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      countAnnouncementAudience(JSON.parse(key) as AnnouncementAudience)
        .then((res) => {
          if (!cancelled) setResult({ key, count: res.count, error: "" });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setResult({ key, count: null, error: describeError(err, "audience").message });
        });
    }, COUNT_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, enabled]);

  if (!enabled) return { status: "idle" };
  if (!result || result.key !== key) return { status: "loading", previous: result?.count ?? null };
  if (result.count === null) return { status: "error", message: result.error };
  return { status: "ready", count: result.count };
}
