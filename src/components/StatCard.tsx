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
    <div className="glass-card-borderless group relative overflow-hidden rounded-3xl p-5.5 transition-all duration-300 hover:-translate-y-0.5">
      {accent && (
        <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-rose-600/15 blur-2xl transition-all duration-300 group-hover:bg-rose-600/25" />
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {label}
        </p>
        {info && (
          <span
            title={info}
            className="inner-glow cursor-help rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 text-slate-300 transition-colors hover:text-rose-200"
          >
            i
          </span>
        )}
      </div>
      <p
        className={`mt-2.5 text-3.5xl font-black tracking-tight ${
          accent
            ? "text-gradient-cherry"
            : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs font-medium text-slate-400/80">{sub}</p>}
      {lowSample && (
        <span className="mt-2.5 inline-block rounded-xl bg-white/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-200 uppercase [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">
          low sample
        </span>
      )}
    </div>
  );
}
