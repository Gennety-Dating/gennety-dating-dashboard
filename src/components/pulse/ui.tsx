import type { ReactNode } from "react";
import type { PulseDataFreshness, PulseSeverity } from "../../lib/pulse-types";
import { ago, pct } from "../../lib/pulse-format";
import { describeError } from "../../lib/useLoad";
import InfoHint from "../InfoHint";

/**
 * Small shared pieces of the Pulse tabs. Colour is a status channel here:
 * rose/amber/emerald appear only for severity and friction, everything else
 * stays in the panel's greys.
 */

export function Block({
  title,
  hint,
  right,
  children,
  className,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">{title}</h2>
          {hint && <InfoHint text={hint} align="left" />}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Loading({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="panel flex items-center gap-2 rounded-lg px-4 py-6 text-xs text-slate-500">
      <span className="h-3 w-3 animate-spin rounded-full border border-white/15 border-t-white/60" />
      {label}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="panel rounded-lg border-rose-500/20 px-4 py-3 text-xs text-rose-300/90">
      Не загрузилось: {describeError(message)}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel rounded-lg px-4 py-6 text-center">
      <p className="text-sm text-slate-300">{title}</p>
      {children && <div className="mt-1 text-xs text-slate-500">{children}</div>}
    </div>
  );
}

/** n < 30: the number is a story, not a statistic — say so next to it. */
export function SmallSample() {
  return (
    <span
      title="Меньше 30 наблюдений: только абсолютные числа, без процентов"
      className="inline-flex shrink-0 items-center rounded border border-amber-500/25 px-1.5 py-px text-[10px] font-medium text-amber-300/90"
    >
      история, не статистика
    </span>
  );
}

const SEVERITY: Record<PulseSeverity, { label: string; cls: string }> = {
  3: { label: "важно", cls: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
  2: { label: "средне", cls: "border-amber-500/35 bg-amber-500/10 text-amber-300" },
  1: { label: "мелочь", cls: "border-white/10 text-slate-400" },
};

export function SeverityPill({ severity }: { severity: PulseSeverity }) {
  const s = SEVERITY[severity] ?? SEVERITY[1];
  return (
    <span
      className={`inline-flex h-fit w-14 shrink-0 self-start justify-center rounded border px-1.5 py-px text-[10px] font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

/** Friction per 100 views: <3 calm, 3–8 worth a look, >8 hurts. */
function frictionTone(f: number | null): string {
  if (f == null) return "text-slate-600";
  if (f > 8) return "text-rose-300";
  if (f >= 3) return "text-amber-300";
  return "text-emerald-300/80";
}

export function FrictionValue({ value }: { value: number | null }) {
  const dot =
    value == null
      ? "bg-slate-700"
      : value > 8
        ? "bg-rose-400"
        : value >= 3
          ? "bg-amber-400"
          : "bg-emerald-400/70";
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${frictionTone(value)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {value == null ? "—" : value.toFixed(1).replace(".", ",")}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-white/10 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded px-2.5 py-1 text-[11px] font-medium ${
            o.value === value ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Monospace pointer into the code: `ios:App/…` or `backend:apps/…`. */
export function CodeHint({ hint }: { hint: string | null }) {
  if (!hint) return null;
  return (
    <code className="block truncate font-mono text-[11px] text-slate-500" title={hint}>
      {hint}
    </code>
  );
}

/**
 * «Как доверять цифрам» in one line: event age, rollup age, consent share,
 * plus amber warnings when screen data cannot be trusted or cannot exist.
 */
export function FreshnessLine({ f }: { f: PulseDataFreshness }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 tabular-nums">
      <span>
        Последнее событие: <span className="text-slate-300">{ago(f.lastEventAt)}</span>
      </span>
      <span>
        Пересчёт: <span className={f.rollupStale ? "text-amber-300" : "text-slate-300"}>{ago(f.lastRollupAt)}</span>
      </span>
      <span>
        Согласие на аналитику:{" "}
        <span className="text-slate-300">
          {f.optInShare == null ? "нет аккаунтов" : `${pct(f.optInShare)} из ${f.optInN}`}
        </span>
      </span>
      {f.rollupStale && (
        <span className="text-amber-300">Ночной пересчёт устарел (&gt; 36 ч) — цифры не свежие</span>
      )}
      {!f.clientEventsEnabled && (
        <span className="text-amber-300">Сбор экранных событий выключен на сервере</span>
      )}
    </div>
  );
}
