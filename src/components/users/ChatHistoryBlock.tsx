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
      <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 p-5 text-xs font-medium text-slate-400">
        No chat history recorded for this user.
      </div>
    );
  }

  return (
    <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-md bg-slate-950/60 p-4 ring-1 ring-white/5">
      {messages.map((m, i) => {
        const role = (m.role ?? "unknown").toLowerCase();
        const isUser = role === "user";
        const isAssistant = role === "assistant" || role === "bot";
        const bubbleCls = isUser
          ? "ml-auto bg-white text-slate-900 font-medium"
          : isAssistant
            ? "mr-auto bg-panel text-slate-100"
            : "mx-auto bg-canvas text-slate-400 italic";
        const content =
          typeof m.content === "string"
            ? m.content
            : JSON.stringify(m.content ?? m, null, 2);

        return (
          <div
            key={i}
            className={`max-w-[80%] rounded-md px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${bubbleCls}`}
          >
            <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-wide uppercase opacity-75">
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
