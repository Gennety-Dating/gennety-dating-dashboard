interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  /**
   * Optional explainer surfaced via a small ⓘ marker. Hover reveals what
   * the metric measures and how it's computed — non-obvious aggregates
   * like "completion rate" or "false-positive proxy" need this so the
   * dashboard reader doesn't misread them.
   */
  info?: string;
  /** Tiny n-data warning. Renders below the value when sample size is too small to draw conclusions. */
  lowSample?: boolean;
}

export default function StatCard({
  label,
  value,
  sub,
  accent,
  info,
  lowSample,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-slate-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-950/20 hover:ring-white/10">
      {accent && (
        <div className="pointer-events-none absolute -top-12 -right-12 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl transition-all duration-300 group-hover:bg-violet-500/20" />
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {label}
        </p>
        {info && (
          <span
            title={info}
            className="cursor-help rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium leading-4 text-slate-400 ring-1 ring-white/10 transition-colors hover:bg-violet-500/20 hover:text-violet-300 hover:ring-violet-500/30"
          >
            i
          </span>
        )}
      </div>
      <p
        className={`mt-2 text-3xl font-extrabold tracking-tight ${
          accent
            ? "bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent"
            : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs font-medium text-slate-400/80">{sub}</p>}
      {lowSample && (
        <span className="mt-2 inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-300 uppercase ring-1 ring-amber-500/20">
          low sample
        </span>
      )}
    </div>
  );
}
