import { useMemo, useState } from "react";
import type { DialogDetail, DialogMessage } from "../../lib/api";
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

const SOURCE_STYLES: Record<string, string> = {
  agent: "bg-violet-500/15 text-violet-300",
  aether: "bg-sky-500/15 text-sky-300",
  timeline: "bg-emerald-500/15 text-emerald-300",
};

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

export default function DialogTranscript({ dialog }: Props) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-1 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(["agent", "aether", "timeline"] as const).map((s) => (
            <span
              key={s}
              title={
                dialog.sources[s]
                  ? `${s}: ${dialog.counts[s]} messages`
                  : `${s} store unavailable on this server`
              }
              className={`rounded px-1.5 py-0.5 ${
                dialog.sources[s]
                  ? SOURCE_STYLES[s]
                  : "bg-slate-800 text-slate-600 line-through"
              }`}
            >
              {s} {dialog.sources[s] ? dialog.counts[s] : "—"}
            </span>
          ))}
          <span className="text-slate-500">
            {visible.length} of {dialog.messages.length} shown
          </span>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400 select-none">
          <input
            type="checkbox"
            checked={showTechnical}
            onChange={(e) => setShowTechnical(e.target.checked)}
            className="accent-violet-500"
          />
          Show technical ({technicalCount})
        </label>
      </div>

      {/* Transcript */}
      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-4">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
            {dialog.messages.length === 0
              ? "No conversation recorded for this user."
              : "Nothing to show — enable “Show technical” for system and tool activity."}
          </div>
        ) : (
          visible.map((m) => {
            const inbound = isInbound(m);
            const kindLabel = m.kind ? KIND_LABELS[m.kind] ?? m.kind : null;
            // A tap or Mini App submission is an event, not speech — render it
            // as a compact centred marker so it reads differently from a message.
            const isEvent =
              m.kind === "callback_tap" ||
              m.kind === "mini_app_action" ||
              m.kind === "payment";

            if (isEvent) {
              return (
                <div key={m.id} className="mx-auto flex w-fit max-w-[85%] flex-col items-center">
                  <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                    {kindLabel === "button tap" ? "👆" : kindLabel === "payment" ? "⭐" : "📱"}{" "}
                    {m.text}
                    {m.surface && (
                      <span className="ml-1.5 text-emerald-400/60">· {m.surface}</span>
                    )}
                  </div>
                  {m.createdAt && (
                    <span className="mt-0.5 text-[10px] text-slate-600">
                      {formatTime(m.createdAt)}
                    </span>
                  )}
                </div>
              );
            }

            const bubbleCls = m.technical
              ? "bg-slate-900/60 border-slate-800 text-slate-400 italic"
              : inbound
                ? "bg-violet-500/20 border-violet-500/30 text-violet-50"
                : "bg-slate-800 border-slate-700 text-slate-100";

            return (
              <div
                key={m.id}
                className={`flex w-fit max-w-[80%] flex-col ${inbound ? "ml-auto" : "mr-auto"}`}
              >
                <div className={`rounded-2xl border px-4 py-2.5 text-sm ${bubbleCls}`}>
                  <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] tracking-wide uppercase opacity-60">
                    <span>{inbound ? "user" : "bot"}</span>
                    <span className={`rounded px-1 ${SOURCE_STYLES[m.source] ?? ""}`}>
                      {m.source}
                    </span>
                    {kindLabel && kindLabel !== "text" && (
                      <span className="rounded bg-slate-950/60 px-1">{kindLabel}</span>
                    )}
                    {m.createdAt && <span>• {formatTime(m.createdAt)}</span>}
                  </div>

                  {m.image && (
                    <button
                      type="button"
                      onClick={() => setLightbox(m.image!.ref)}
                      className="mb-1.5 block cursor-zoom-in"
                    >
                      <AuthedImage
                        mediaType="chat"
                        refKey={m.image.ref}
                        className="max-h-64 max-w-full rounded-lg object-cover"
                      />
                    </button>
                  )}

                  {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}

                  {/* The buttons that were on offer with this message. */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                      {m.actions.map((a, i) => (
                        <span
                          key={`${a.label}-${i}`}
                          title={a.webApp ? `Mini App: ${a.webApp}` : a.data ?? ""}
                          className={`rounded-md border px-2 py-0.5 text-xs ${
                            a.webApp
                              ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
                              : "border-slate-600 bg-slate-900/60 text-slate-300"
                          }`}
                        >
                          {a.webApp && "🪟 "}
                          {a.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {m.toolCalls.map((tc, i) => (
                        <div
                          key={i}
                          className="rounded-md bg-slate-950/70 px-2 py-1 font-mono text-[11px] leading-relaxed break-all text-amber-300/80"
                        >
                          <span className="text-amber-200">{tc.name}</span>({tc.arguments})
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

      {/* Profile photos — a gallery, deliberately not interleaved. */}
      {dialog.photos.length > 0 && (
        <div className="border-t border-slate-800 px-1 pt-3">
          <p className="mb-2 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
            Profile photos ({dialog.photos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {dialog.photos.map((p, i) => (
              <button
                key={`${p.ref}-${i}`}
                type="button"
                onClick={() => setLightbox(p.ref)}
                className="cursor-zoom-in overflow-hidden rounded-lg border border-slate-800 hover:border-slate-600"
              >
                <AuthedImage mediaType="photo" refKey={p.ref} className="h-20 w-20 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          <AuthedImage
            mediaType="photo"
            refKey={lightbox}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
