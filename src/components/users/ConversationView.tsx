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
  const hasMobile = conversation.messages.some((m) => m.source === "mobile");
  const bothSources = hasTelegram && hasMobile;

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-1 pb-3">
        <div className="flex items-center gap-2 text-xs">
          {hasTelegram && (
            <span className="rounded-lg bg-white/5 px-2.5 py-0.5 font-semibold text-slate-300 ring-1 ring-white/10">Telegram</span>
          )}
          {hasMobile && (
            <span className="rounded-lg bg-sky-500/10 px-2.5 py-0.5 font-semibold text-sky-300 ring-1 ring-sky-500/20">Приложение</span>
          )}
          <span className="text-slate-400 font-medium">
            {visible.length} of {conversation.messages.length} shown
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
            Nothing to show — enable “Show technical” for system and tool activity.
          </div>
        ) : (
          visible.map((m) => {
            const role = m.role.toLowerCase();
            const isUser = role === "user";
            const isAssistant = role === "assistant" || role === "bot";
            const wrapAlign = isUser ? "ml-auto" : isAssistant ? "mr-auto" : "mx-auto";
            const bubbleCls = isUser
              ? "bg-white text-slate-900 font-medium [box-shadow:0_4px_12px_rgba(0,0,0,0.3)]"
              : isAssistant
                ? "bg-[#17181c] text-slate-100 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
                : "bg-[#121316] text-slate-400 italic [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.08)]";
            const img = m.image;

            return (
              <div key={m.id} className={`flex w-fit max-w-[80%] flex-col ${wrapAlign}`}>
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${bubbleCls}`}>
                  <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase opacity-75">
                    <span>{m.role}</span>
                    {bothSources && m.source === "mobile" && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-white ring-1 ring-white/20">app</span>
                    )}
                    {m.createdAt && <span>• {formatTime(m.createdAt)}</span>}
                  </div>

                  {img && (
                    <button
                      type="button"
                      onClick={() => setLightbox({ mediaType: img.type, refKey: img.ref })}
                      className="mb-2 block overflow-hidden rounded-xl cursor-zoom-in ring-1 ring-white/10 hover:ring-[#9f1239] hover:shadow-[0_0_15px_rgba(159,18,57,0.4)] transition-all"
                    >
                      <AuthedImage
                        mediaType={img.type}
                        refKey={img.ref}
                        className="max-h-64 max-w-full object-cover"
                      />
                    </button>
                  )}

                  {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}

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
      {conversation.photos.length > 0 && (
        <div className="border-t border-white/5 px-1 pt-3.5">
          <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Profile photos ({conversation.photos.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {conversation.photos.map((p, i) => (
              <button
                key={`${p.ref}-${i}`}
                type="button"
                onClick={() => setLightbox({ mediaType: "photo", refKey: p.ref })}
                className="cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-[#9f1239] hover:shadow-[0_0_15px_rgba(159,18,57,0.4)] hover:scale-105"
              >
                <AuthedImage mediaType="photo" refKey={p.ref} className="h-16 w-16 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#121316]/90 p-6 backdrop-blur-xl"
        >
          <AuthedImage
            mediaType={lightbox.mediaType}
            refKey={lightbox.refKey}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>
      )}
    </div>
  );
}
