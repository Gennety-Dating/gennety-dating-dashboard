interface Props {
  summary: string | null;
}

export default function PsychProfileBlock({ summary }: Props) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-5 text-sm text-slate-500">
        No psychological summary has been generated for this user yet.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-slate-900 to-slate-900 p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-400 to-fuchsia-500" />
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-violet-300 uppercase">
          AI Generated
        </span>
        <span className="text-xs text-slate-400">Psychological Summary</span>
      </div>
      <blockquote className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
        {summary}
      </blockquote>
    </div>
  );
}
