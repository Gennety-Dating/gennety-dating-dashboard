interface Props {
  summary: string | null;
}

export default function PsychProfileBlock({ summary }: Props) {
  if (!summary) {
    return (
      <div className="rounded-2xl bg-slate-950/60 p-5 text-xs font-medium text-slate-400 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]">
        No psychological summary has been generated for this user yet.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-950 to-slate-950 p-5.5 shadow-2xl [box-shadow:inset_0_1px_1.5px_rgba(244,63,94,0.35),inset_0_0_18px_rgba(244,63,94,0.1)]">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-400 to-rose-700" />
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-xl bg-rose-950/60 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-rose-200 uppercase [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.4)]">
          AI Generated
        </span>
        <span className="text-xs font-semibold text-rose-200/80">Psychological Profile</span>
      </div>
      <blockquote className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
        {summary}
      </blockquote>
    </div>
  );
}
