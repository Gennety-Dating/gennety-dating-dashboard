import { useMemo, useState } from "react";
import type { DialogDetail, DialogMedia, DialogMessage, MediaType } from "../../lib/api";
import AuthedImage from "../AuthedImage";

interface Props {
  dialog: DialogDetail;
}

/**
 * Message kinds that are not plain text. The backend records these on
 * `chat_events` rows, and they are most of the point of this view: a
 * transcript that shows only text hides that the bot sent a photo card, a
 * video note, or a Mini App screen — and hides the taps entirely.
 */
const KIND_LABELS: Record<string, string> = {
  photo: "photo",
  album: "album",
  video: "video",
  video_note: "video note",
  voice: "voice",
  document: "document",
  user_text: "text",
  user_voice: "voice",
  user_media: "media",
  user_contact: "contact",
  callback_tap: "button tap",
  mini_app_action: "Mini App",
  payment: "payment",
  text: "text",
};

/**
 * What a ref-less attachment gets instead of a thumbnail.
 *
 * Some formats simply have no image: a voice note is audio, a document may
 * ship without a thumbnail. The event is still worth showing — "the bot sent
 * a voice note here" is exactly the kind of thing this transcript exists to
 * make visible — so it renders as a labelled chip rather than vanishing.
 */
const MEDIA_PLACEHOLDER: Record<string, string> = {
  voice: "🎙 voice note",
  document: "📎 file",
  video: "🎬 video",
  video_note: "⭕ video note",
  animation: "🎞 GIF",
  sticker: "🎨 sticker",
  photo: "🖼 photo",
};

/** Formats whose thumbnail is a poster frame, not the media itself. */
const PLAYABLE_KINDS = new Set(["video", "video_note", "animation"]);

const SOURCE_STYLES: Record<string, string> = {
  agent: "bg-white/10 text-white ring-1 ring-white/20",
  mobile: "bg-slate-200/15 text-slate-200 ring-1 ring-white/15",
  timeline: "bg-slate-200/10 text-slate-300 ring-1 ring-white/10",
};

/** Placeholder captions the backend writes when media carries no caption. */
const CAPTIONLESS = /^\((photo card|photo album|video|video note \/ кружок|voice note|file)[^)]*\)$/;

/** What the lightbox is showing — the ref alone can't say which proxy to use. */
interface Lightbox {
  mediaType: MediaType;
  ref: string;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `in` = the human, `out` = the bot. This is what identifies the speaker. */
function isInbound(m: DialogMessage): boolean {
  return m.direction === "in";
}

/**
 * A caption the backend invented because the media had none is noise once the
 * media itself is on screen — the picture already says "photo card".
 */
function visibleText(m: DialogMessage): string | null {
  if (!m.text) return null;
  const hasMedia = (m.media?.length ?? 0) > 0;
  if (hasMedia && CAPTIONLESS.test(m.text.trim())) return null;
  return m.text;
}

function MediaGrid({
  media,
  onOpen,
}: {
  media: DialogMedia[];
  onOpen: (lightbox: Lightbox) => void;
}) {
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {media.map((item, i) =>
        item.ref ? (
          <button
            key={`${item.ref}-${i}`}
            type="button"
            onClick={() => onOpen({ mediaType: "telegram", ref: item.ref! })}
            title={item.kind}
            className="relative block cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-[#9f1239] hover:shadow-[0_0_15px_rgba(159,18,57,0.4)]"
          >
            <AuthedImage
              mediaType="telegram"
              refKey={item.ref}
              className="h-40 w-40 object-cover"
            />
            {PLAYABLE_KINDS.has(item.kind) && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-2xl">
                ▶
              </span>
            )}
          </button>
        ) : (
          <span
            key={`${item.kind}-${i}`}
            className="rounded-xl bg-white/5 px-3 py-2 text-[11px] font-semibold text-slate-300 ring-1 ring-white/10"
          >
            {MEDIA_PLACEHOLDER[item.kind] ?? `📦 ${item.kind}`}
          </span>
        ),
      )}
    </div>
  );
}

export default function DialogTranscript({ dialog }: Props) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [showProfilePhotos, setShowProfilePhotos] = useState(false);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);

  const visible = useMemo(
    () => dialog.messages.filter((m) => showTechnical || !m.technical),
    [dialog.messages, showTechnical],
  );
  const technicalCount = useMemo(
    () => dialog.messages.filter((m) => m.technical).length,
    [dialog.messages],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Source availability + technical toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-1 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(["agent", "mobile", "timeline"] as const).map((s) => (
            <span
              key={s}
              title={
                dialog.sources[s]
                  ? `${s}: ${dialog.counts[s]} messages`
                  : `${s} store unavailable on this server`
              }
              className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                dialog.sources[s]
                  ? SOURCE_STYLES[s]
                  : "bg-white/5 text-slate-500 line-through"
              }`}
            >
              {s} {dialog.sources[s] ? dialog.counts[s] : "—"}
            </span>
          ))}
          <span className="text-[11px] font-medium text-slate-400">
            {visible.length} of {dialog.messages.length} shown
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/*
            The profile gallery used to be a permanent strip pinned under the
            transcript, which read as "the registration photos are stuck at the
            bottom of the chat" — they are not chat messages at all, they are
            the current contents of `Profile.photos`. It collapses here, out of
            the message flow, so the chat below is only ever the conversation.
          */}
          {dialog.photos.length > 0 && (
            <button
              type="button"
              onClick={() => setShowProfilePhotos((v) => !v)}
              className="cursor-pointer rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-white/10 transition-colors hover:text-white"
            >
              {showProfilePhotos ? "▾" : "▸"} Profile photos ({dialog.photos.length})
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-400 select-none hover:text-slate-300 transition-colors">
            <input
              type="checkbox"
              checked={showTechnical}
              onChange={(e) => setShowTechnical(e.target.checked)}
              className="accent-[#9f1239] cursor-pointer rounded"
            />
            Show technical ({technicalCount})
          </label>
        </div>
      </div>

      {/* Profile photo gallery — the CURRENT profile, not chat history */}
      {showProfilePhotos && dialog.photos.length > 0 && (
        <div className="border-b border-white/5 px-1 py-3">
          <p className="mb-2 text-[10px] font-medium text-slate-500">
            Current contents of the dating profile — not messages. Sent in chat during
            onboarding, before the timeline starts recording.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dialog.photos.map((p, i) => (
              <button
                key={`${p.ref}-${i}`}
                type="button"
                onClick={() => setLightbox({ mediaType: "photo", ref: p.ref })}
                className="shrink-0 cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-[#9f1239] hover:shadow-[0_0_15px_rgba(159,18,57,0.4)]"
              >
                <AuthedImage mediaType="photo" refKey={p.ref} className="h-24 w-24 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 space-y-3.5 overflow-y-auto px-1 py-4">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center text-xs font-medium text-slate-400">
            {dialog.messages.length === 0
              ? "No conversation recorded for this user."
              : "Nothing to show — enable “Show technical” for system and tool activity."}
          </div>
        ) : (
          visible.map((m) => {
            const inbound = isInbound(m);
            const kindLabel = m.kind ? KIND_LABELS[m.kind] ?? m.kind : null;
            const isEvent =
              m.kind === "callback_tap" ||
              m.kind === "mini_app_action" ||
              m.kind === "payment";

            if (isEvent) {
              return (
                <div key={m.id} className="mx-auto flex w-fit max-w-[85%] flex-col items-center">
                  <div className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/15 shadow-sm">
                    {kindLabel === "button tap" ? "👆" : kindLabel === "payment" ? "⭐" : "📱"}{" "}
                    {m.text}
                    {m.surface && (
                      <span className="ml-1.5 text-slate-400">· {m.surface}</span>
                    )}
                  </div>
                  {m.createdAt && (
                    <span className="mt-1 text-[10px] font-medium text-slate-500">
                      {formatTime(m.createdAt)}
                    </span>
                  )}
                </div>
              );
            }

            const bubbleCls = m.technical
              ? "bg-[#121316] text-slate-400 italic [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.08)]"
              : inbound
                ? "bg-white text-slate-900 font-medium [box-shadow:0_4px_12px_rgba(0,0,0,0.3)]"
                : "bg-[#17181c] text-slate-100 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]";

            const body = visibleText(m);

            return (
              <div
                key={m.id}
                className={`flex w-fit max-w-[80%] flex-col ${inbound ? "ml-auto" : "mr-auto"}`}
              >
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${bubbleCls}`}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase opacity-75">
                    <span>{inbound ? "user" : "bot"}</span>
                    <span className={`rounded-md px-1.5 py-0.5 ${SOURCE_STYLES[m.source] ?? ""}`}>
                      {m.source}
                    </span>
                    {kindLabel && kindLabel !== "text" && (
                      <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-slate-300 ring-1 ring-white/10">{kindLabel}</span>
                    )}
                    {m.createdAt && <span>• {formatTime(m.createdAt)}</span>}
                  </div>

                  {/* Telegram media, inline and in place */}
                  {m.media && m.media.length > 0 && (
                    <MediaGrid media={m.media} onOpen={setLightbox} />
                  )}

                  {/* Mobile chat image (a Supabase path, hence a different proxy type) */}
                  {m.image && (
                    <button
                      type="button"
                      onClick={() => setLightbox({ mediaType: "chat", ref: m.image!.ref })}
                      className="mb-2 block overflow-hidden rounded-xl cursor-zoom-in ring-1 ring-white/10 hover:ring-[#9f1239] hover:shadow-[0_0_15px_rgba(159,18,57,0.4)] transition-all"
                    >
                      <AuthedImage
                        mediaType="chat"
                        refKey={m.image.ref}
                        className="max-h-64 max-w-full object-cover"
                      />
                    </button>
                  )}

                  {body && <div className="whitespace-pre-wrap">{body}</div>}

                  {/* Buttons on offer with this message */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                      {m.actions.map((a, i) => (
                        <span
                          key={`${a.label}-${i}`}
                          title={a.webApp ? `Mini App: ${a.webApp}` : a.data ?? ""}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                            a.webApp
                              ? "bg-white/10 text-white ring-1 ring-white/20"
                              : "bg-[#17181c] text-slate-300 ring-1 ring-white/10"
                          }`}
                        >
                          {a.webApp && "🪟 "}
                          {a.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.toolCalls.map((tc, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-[#17181c] px-2.5 py-1 font-mono text-[11px] leading-relaxed break-all text-slate-200 ring-1 ring-white/15"
                        >
                          <span className="text-white font-semibold">{tc.name}</span>({tc.arguments})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#121316]/90 p-6 backdrop-blur-xl"
        >
          <AuthedImage
            mediaType={lightbox.mediaType}
            refKey={lightbox.ref}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>
      )}
    </div>
  );
}
