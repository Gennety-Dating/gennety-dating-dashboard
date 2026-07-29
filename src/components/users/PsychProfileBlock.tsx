interface Props {
  summary: string | null;
}

export default function PsychProfileBlock({ summary }: Props) {
  if (!summary) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-xs font-medium text-slate-400">
        No psychological summary has been generated for this user yet.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/15 via-slate-950 to-slate-950 p-5 shadow-xl ring-1 ring-violet-500/30">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-400 to-indigo-500" />
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-violet-300 uppercase">
          AI Generated
        </span>
        <span className="text-xs font-medium text-slate-400">Psychological Profile</span>
      </div>
      <blockquote className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
        {summary}
      </blockquote>
    </div>
  );
}
