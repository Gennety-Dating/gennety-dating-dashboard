import InfoHint from "./InfoHint";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  /** Raises the value to the largest step in the scale. Reserved for the North Star metric. */
  accent?: boolean;
  /** Methodology note, surfaced on hover/focus of the ⓘ marker rather than printed under the value. */
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
    <div className="panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
          {label}
        </p>
        {info && <InfoHint text={info} />}
      </div>
      {/* `tabular-nums` is not decoration: these cards sit in a 4-up grid and
          the eye compares them column-wise, which proportional digits break. */}
      <p
        className={`mt-2 font-semibold tracking-tight text-white tabular-nums ${
          accent ? "text-3xl" : "text-2xl"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      {lowSample && (
        <span className="mt-2 inline-block rounded-md border border-amber-500/25 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-amber-300/90 uppercase">
          low sample
        </span>
      )}
    </div>
  );
}
