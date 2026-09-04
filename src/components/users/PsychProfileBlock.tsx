interface Props {
  summary: string | null;
}

export default function PsychProfileBlock({ summary }: Props) {
  if (!summary) {
    return (
      <div className="rounded-md bg-slate-950/60 p-5 text-xs font-medium text-slate-400">
        No psychological summary has been generated for this user yet.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-canvas p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
          AI Generated
        </span>
        <span className="text-xs font-semibold text-slate-400">Psychological Profile</span>
      </div>
      <blockquote className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
        {summary}
      </blockquote>
    </div>
  );
}
