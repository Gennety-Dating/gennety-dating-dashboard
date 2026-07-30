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
  agent: "bg-white/10 text-white ring-1 ring-white/20",
  aether: "bg-slate-200/15 text-slate-200 ring-1 ring-white/15",
  timeline: "bg-slate-200/10 text-slate-300 ring-1 ring-white/10",
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-1 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(["agent", "aether", "timeline"] as const).map((s) => (
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

                  {m.image && (
                    <button
                      type="button"
                      onClick={() => setLightbox(m.image!.ref)}
                      className="mb-2 block overflow-hidden rounded-xl cursor-zoom-in ring-1 ring-white/10 hover:ring-violet-500/50 transition-all"
                    >
                      <AuthedImage
                        mediaType="chat"
                        refKey={m.image.ref}
                        className="max-h-64 max-w-full object-cover"
                      />
                    </button>
                  )}

                  {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}

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

      {/* Profile photos gallery */}
      {dialog.photos.length > 0 && (
        <div className="border-t border-white/5 px-1 pt-3.5">
          <p className="mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Profile photos ({dialog.photos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {dialog.photos.map((p, i) => (
              <button
                key={`${p.ref}-${i}`}
                type="button"
                onClick={() => setLightbox(p.ref)}
                className="cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-violet-500/50 hover:scale-105"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-md"
        >
          <AuthedImage
            mediaType="photo"
            refKey={lightbox}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>
      )}
    </div>
  );
}
