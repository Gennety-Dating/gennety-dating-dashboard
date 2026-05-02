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
    <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          {label}
        </p>
        {info && (
          <span
            title={info}
            className="cursor-help rounded-full border border-slate-700 px-1.5 text-[10px] leading-4 text-slate-400 hover:border-violet-500 hover:text-violet-300"
          >
            i
          </span>
        )}
      </div>
      <p
        className={`mt-1 text-3xl font-bold ${accent ? "text-violet-400" : "text-white"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      {lowSample && (
        <p className="mt-1 text-[10px] tracking-wide text-amber-400/80 uppercase">
          low sample
        </p>
      )}
    </div>
  );
}
