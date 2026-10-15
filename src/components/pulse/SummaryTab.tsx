import { useMemo } from "react";
import { getPulseBrief, getPulseInsights } from "../../lib/api";
import type {
  PulseBriefInsight,
  PulseDataFreshness,
  PulseInsight,
  PulseInsightKind,
  PulseKpi,
} from "../../lib/pulse-types";
import { dateTime, day, num, usd } from "../../lib/pulse-format";
import { useLoad } from "../../lib/useLoad";
import { Block, CodeHint, Empty, FreshnessLine, InlineError, Loading, SeverityPill, SmallSample } from "./ui";

const KIND_LABEL: Record<PulseInsightKind, string> = {
  stuck_people: "застряли",
  funnel_drop: "воронка",
  screen_friction: "трение",
  slow_decision: "долгое решение",
  anomaly: "аномалия",
  unseen: "не замечают",
};

function kpiValue(k: PulseKpi, v: number | null): string {
  return k.unit === "usd" ? usd(v) : num(v);
}

function KpiTile({ k }: { k: PulseKpi }) {
  const { thisWeek: a, lastWeek: b } = k;
  const delta = a != null && b != null ? a - b : null;
  const arrow = delta == null ? "" : delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  let compare: string;
  if (a == null || b == null) compare = "нет данных за одну из недель";
  else if (k.smallSample || b === 0) compare = `${kpiValue(k, a)} против ${kpiValue(k, b)}`;
  else {
    const rel = Math.round(((a - b) / b) * 100);
    compare = `${rel > 0 ? "+" : ""}${rel}% к прошлой (${kpiValue(k, b)})`;
  }
  return (
    <div className="panel rounded-lg p-4">
      <p className="min-h-[2lh] text-[11px] leading-snug text-slate-500">{k.label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">
          {kpiValue(k, a)}
        </span>
        {arrow && <span className="text-sm text-slate-400">{arrow}</span>}
      </div>
      <p className="mt-1 text-xs text-slate-500 tabular-nums">{compare}</p>
      {k.smallSample && (
        <div className="mt-2">
          <SmallSample />
        </div>
      )}
    </div>
  );
}

function collectionGap(f: PulseDataFreshness): string | null {
  if (!f.clientEventsEnabled) return "Сбор экранных событий выключен на сервере (CLIENT_EVENTS_ENABLED).";
  if (f.optInShare === 0 || f.optInN === 0) return "Пока никто не дал согласие на аналитику.";
  if (!f.lastEventAt) return "Ни одного экранного события ещё не пришло.";
  return null;
}

function InsightRow({ i, full }: { i: PulseBriefInsight; full?: PulseInsight }) {
  return (
    <li className="flex gap-3 border-b border-white/5 px-4 py-3 last:border-b-0">
      <SeverityPill severity={i.severity} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-slate-100">{i.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 tabular-nums">
          <span>{KIND_LABEL[i.kind] ?? i.kind}</span>
          <span>n = {i.n}</span>
          {i.smallSample && <SmallSample />}
          {full && (
            <span title="Впервые замечено · последний раз подтверждено пересчётом">
              {dateTime(full.firstSeenAt)} → {dateTime(full.lastSeenAt)}
            </span>
          )}
        </div>
        <div className="mt-1">
          <CodeHint hint={i.codeHint} />
        </div>
      </div>
    </li>
  );
}

export default function SummaryTab({ reloadToken }: { reloadToken: number }) {
  const force = reloadToken > 0;
  const brief = useLoad(`brief:${reloadToken}`, () => getPulseBrief(force));
  // Only for first/last-seen dates — the brief's compact rows omit them.
  const insights = useLoad(`insights:${reloadToken}`, () => getPulseInsights("open", force));
  const byId = useMemo(
    () => new Map((insights.data?.insights ?? []).map((i) => [i.id, i])),
    [insights.data],
  );

  if (brief.loading) return <Loading />;
  if (brief.error || !brief.data) return <InlineError message={brief.error ?? "пустой ответ"} />;

  const b = brief.data;
  const gap = collectionGap(b.dataFreshness);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <FreshnessLine f={b.dataFreshness} />
        <p className="text-[11px] text-slate-600 tabular-nums">
          Неделя {day(b.thisWeek.from)}–{day(b.thisWeek.to)} против {day(b.lastWeek.from)}–
          {day(b.lastWeek.to)} · по {day(b.asOf)} включительно, UTC
        </p>
      </div>

      {gap && (
        <div className="panel rounded-lg border-amber-500/20 px-4 py-3 text-xs text-slate-300">
          <span className="text-amber-300">Экранных данных нет.</span> {gap} Серверные цифры ниже —
          про всех.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {b.kpis.map((k) => (
          <KpiTile key={k.key} k={k} />
        ))}
      </div>

      <Block
        title={`Находки · ${b.openInsights} открыто`}
        hint="Ночной пересчёт ищет застрявших людей, провалы воронки, трение экранов, долгие решения, аномалии и незамеченные блоки. Порядок — важность × число людей."
        right={
          b.insights.length < b.openInsights ? (
            <span className="text-[11px] text-slate-500">
              показаны {b.insights.length} самых весомых
            </span>
          ) : null
        }
      >
        {b.insights.length === 0 ? (
          <Empty title="Открытых находок нет">
            {gap ? "Сначала нужны данные — см. предупреждение выше." : "Пересчёт ничего не нашёл."}
          </Empty>
        ) : (
          <ul className="panel overflow-hidden rounded-lg">
            {b.insights.map((i) => (
              <InsightRow key={i.id} i={i} full={byId.get(i.id)} />
            ))}
          </ul>
        )}
        {insights.error && (
          <p className="mt-2 text-[11px] text-slate-600">Даты находок не загрузились.</p>
        )}
      </Block>
    </div>
  );
}
