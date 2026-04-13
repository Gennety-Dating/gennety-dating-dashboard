import type { ChatMessage } from "../../lib/api";

interface Props {
  messages: ChatMessage[] | null;
}

function formatTime(ts: string | number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatHistoryBlock({ messages }: Props) {
  if (!messages || messages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-5 text-sm text-slate-500">
        No chat history recorded for this user.
      </div>
    );
  }

  return (
    <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      {messages.map((m, i) => {
        const role = (m.role ?? "unknown").toLowerCase();
        const isUser = role === "user";
        const isAssistant = role === "assistant" || role === "bot";
        const bubbleCls = isUser
          ? "ml-auto bg-violet-500/20 border-violet-500/30 text-violet-50"
          : isAssistant
            ? "mr-auto bg-slate-800 border-slate-700 text-slate-100"
            : "mx-auto bg-slate-900/60 border-slate-800 text-slate-400 italic";
        const content =
          typeof m.content === "string"
            ? m.content
            : JSON.stringify(m.content ?? m, null, 2);

        return (
          <div
            key={i}
            className={`max-w-[80%] rounded-xl border px-4 py-2.5 text-sm whitespace-pre-wrap ${bubbleCls}`}
          >
            <div className="mb-1 flex items-center gap-2 text-[10px] tracking-wide uppercase opacity-70">
              <span>{role}</span>
              {m.timestamp !== undefined && (
                <span>• {formatTime(m.timestamp)}</span>
              )}
            </div>
            <div>{content}</div>
          </div>
        );
      })}
    </div>
  );
}
