import { useMemo, useState } from "react";
import type { MediaType, UserConversation } from "../../lib/api";
import AuthedImage from "../AuthedImage";

interface Props {
  conversation: UserConversation;
}

interface Lightbox {
  mediaType: MediaType;
  refKey: string;
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

export default function ConversationView({ conversation }: Props) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);

  const visible = useMemo(
    () => conversation.messages.filter((m) => showTechnical || !m.technical),
    [conversation.messages, showTechnical],
  );

  const technicalCount = useMemo(
    () => conversation.messages.filter((m) => m.technical).length,
    [conversation.messages],
  );
  const hasTelegram = conversation.messages.some((m) => m.source === "telegram");
  const hasAether = conversation.messages.some((m) => m.source === "aether");
  const bothSources = hasTelegram && hasAether;

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-1 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {hasTelegram && (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">Telegram</span>
          )}
          {hasAether && (
            <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-300">Aether</span>
          )}
          <span>
            {visible.length} of {conversation.messages.length} shown
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
            {conversation.messages.length === 0
              ? "No conversation recorded for this user."
              : technicalCount > 0 && !showTechnical
                ? "No user/bot turns to show — enable “Show technical” to see system and tool activity."
                : "No messages to show."}
          </div>
        ) : (
          visible.map((m) => {
            const role = m.role.toLowerCase();
            const isUser = role === "user";
            const isAssistant = role === "assistant" || role === "bot";
            const wrapAlign = isUser ? "ml-auto" : isAssistant ? "mr-auto" : "mx-auto";
            const bubbleCls = isUser
              ? "bg-violet-500/20 border-violet-500/30 text-violet-50"
              : isAssistant
                ? "bg-slate-800 border-slate-700 text-slate-100"
                : "bg-slate-900/60 border-slate-800 text-slate-400 italic";
            const img = m.image;

            return (
              <div key={m.id} className={`flex w-fit max-w-[80%] flex-col ${wrapAlign}`}>
                <div className={`rounded-2xl border px-4 py-2.5 text-sm ${bubbleCls}`}>
                  <div className="mb-1 flex items-center gap-2 text-[10px] tracking-wide uppercase opacity-60">
                    <span>{m.role}</span>
                    {bothSources && m.source === "aether" && (
                      <span className="rounded bg-sky-500/15 px-1 text-sky-300">aether</span>
                    )}
                    {m.createdAt && <span>• {formatTime(m.createdAt)}</span>}
                  </div>

                  {img && (
                    <button
                      type="button"
                      onClick={() => setLightbox({ mediaType: img.type, refKey: img.ref })}
                      className="mb-1.5 block cursor-zoom-in"
                    >
                      <AuthedImage
                        mediaType={img.type}
                        refKey={img.ref}
                        className="max-h-64 max-w-full rounded-lg object-cover"
                      />
                    </button>
                  )}

                  {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}

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

      {/* Profile photos gallery — not interleaved into the transcript */}
      {conversation.photos.length > 0 && (
        <div className="border-t border-slate-800 px-1 pt-3">
          <p className="mb-2 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
            Profile photos ({conversation.photos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {conversation.photos.map((p, i) => (
              <button
                key={`${p.ref}-${i}`}
                type="button"
                onClick={() => setLightbox({ mediaType: "photo", refKey: p.ref })}
                className="cursor-zoom-in overflow-hidden rounded-lg border border-slate-800 hover:border-slate-600"
              >
                <AuthedImage
                  mediaType="photo"
                  refKey={p.ref}
                  className="h-20 w-20 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          <AuthedImage
            mediaType={lightbox.mediaType}
            refKey={lightbox.refKey}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
