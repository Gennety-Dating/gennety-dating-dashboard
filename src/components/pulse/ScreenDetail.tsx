import type { ReactNode } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getPulseScreen } from "../../lib/api";
import type { PulseScreenDay, PulseScreenWindow } from "../../lib/pulse-types";
import { day, duration, num, pct, platformLabel } from "../../lib/pulse-format";
import { TOOLTIP_STYLE } from "../../lib/chartTheme";
import { useLoad } from "../../lib/useLoad";
import type { PulseWindow } from "../../lib/analytics-tabs";
import TapMap from "./TapMap";
import { Block, CodeHint, FrictionValue, InlineError, Loading, SmallSample } from "./ui";

const AXIS = { fill: "#64748b", fontSize: 10 } as const;

/** The API omits days without data; the chart needs them as zeros. */
function fillDays(days: PulseScreenDay[]): Array<PulseScreenDay & { label: string }> {
  if (days.length === 0) return [];
  const byDay = new Map(days.map((d) => [d.day, d]));
  const last = new Date(`${days[days.length - 1].day}T00:00:00Z`);
  const out: Array<PulseScreenDay & { label: string }> = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(last.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    const row = byDay.get(d) ?? {
      day: d, views: 0, left: 0, dwellP50Ms: null, dwellP90Ms: null, firstActionP50Ms: null,
      quickBack: 0, exits: 0, taps: 0, deadTaps: 0, rageTaps: 0,
    };
    out.push({ ...row, label: day(d) });
  }
  return out;
}

function Metric({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="panel rounded-lg px-3 py-2.5">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 tabular-nums">{sub}</p>}
    </div>
  );
}

function WindowStrip({ m }: { m: PulseScreenWindow }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      <Metric label="Трение" value={<FrictionValue value={m.friction} />} />
      <Metric label="Показы" value={num(m.views)} sub={`${num(m.viewerDays)} чел.-дней`} />
      <Metric label="Время p50 / p90" value={duration(m.dwellP50Ms)} sub={duration(m.dwellP90Ms)} />
      <Metric label="До первого касания" value={duration(m.firstActionP50Ms)} />
      <Metric label="Быстрый уход" value={num(m.quickBack)} sub={`из ${num(m.left)} уходов`} />
      <Metric label="Мимо / ярость" value={`${num(m.deadTaps)} / ${num(m.rageTaps)}`} />
      <Metric
        label="Сворачивания"
        value={num(m.exits)}
        sub={m.exitShare == null ? `из ${num(m.left)}` : pct(m.exitShare)}
      />
    </div>
  );
}

function Spark({
  title,
  data,
  lines,
}: {
  title: string;
  data: object[];
  lines: Array<{ key: string; name: string; color: string }>;
}) {
  return (
    <div className="panel rounded-lg p-3">
      <div className="mb-1 flex items-center gap-3 text-[11px] text-slate-500">
        <span className="text-slate-300">{title}</span>
        {lines.length > 1 &&
          lines.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full" style={{ background: l.color }} />
              {l.name}
            </span>
          ))}
      </div>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -28 }}>
            <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {lines.map((l) => (
              <Line
                key={l.key}
                dataKey={l.key}
                name={l.name}
                stroke={l.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BarList({ rows, empty }: { rows: Array<{ label: string; n: number; sub?: string }>; empty: string }) {
  if (rows.length === 0) return <p className="px-3 py-3 text-xs text-slate-600">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <ul className="divide-y divide-white/5">
      {rows.map((r) => (
        <li key={r.label} className="relative px-3 py-1.5 text-xs">
          <span
            className="absolute inset-y-0.5 left-0 rounded-r bg-white/[0.05]"
            style={{ width: `${(r.n / max) * 100}%` }}
          />
          <span className="relative flex justify-between gap-3">
            <code className="truncate font-mono text-[11px] text-slate-300">{r.label}</code>
            <span className="shrink-0 text-slate-400 tabular-nums">
              {num(r.n)}
              {r.sub && <span className="ml-1 text-slate-600">{r.sub}</span>}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ScreenDetail({
  screen,
  win,
  controls,
  reloadToken,
  onBack,
}: {
  screen: string;
  win: PulseWindow;
  controls: ReactNode;
  reloadToken: number;
  onBack: () => void;
}) {
  const force = reloadToken > 0;
  const res = useLoad(`screen:${screen}:${reloadToken}`, () => getPulseScreen(screen, force));
  const back = (
    <button type="button" onClick={onBack} className="btn cursor-pointer rounded-md px-2.5 py-1 text-xs">
      ← Все экраны
    </button>
  );

  if (res.loading) return <div className="space-y-3">{back}<Loading /></div>;
  if (res.error || !res.data)
    return <div className="space-y-3">{back}<InlineError message={res.error ?? "пустой ответ"} /></div>;

  const d = res.data;
  const m = d[win];
  const series = fillDays(d.days);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {back}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">{d.title}</h2>
              <span className="text-xs text-slate-500">{platformLabel(d.platform)}</span>
              {m.smallSample && <SmallSample />}
            </div>
            <span className="font-mono text-[11px] text-slate-600">{d.screen}</span>
            <CodeHint hint={d.codeHint} />
          </div>
        </div>
        {controls}
      </div>

      <WindowStrip m={m} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Spark title="Показы по дням" data={series} lines={[{ key: "views", name: "показы", color: "#cbd5e1" }]} />
        <Spark
          title="Сбои по дням"
          data={series}
          lines={[
            { key: "quickBack", name: "быстрый уход", color: "#94a3b8" },
            { key: "deadTaps", name: "мимо", color: "#fbbf24" },
            { key: "rageTaps", name: "ярость", color: "#fb7185" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_1fr]">
        <Block title="Карта касаний · 28 дней">
          {d.tracksTaps ? (
            <TapMap key={d.screen} screen={d.screen} {...d.taps} />
          ) : (
            <p className="text-xs text-slate-500">Этот экран не записывает касания.</p>
          )}
        </Block>

        <div className="grid grid-cols-1 content-start gap-5 md:grid-cols-2">
          <Block title="Элементы · касания">
            <div className="panel rounded-lg">
              <BarList
                rows={d.elements.map((e) => ({ label: e.element, n: e.taps }))}
                empty="Касаний по элементам нет."
              />
            </div>
          </Block>
          <Block title="Блоки, которые видели ≥1 с · 7 дней">
            <div className="panel rounded-lg">
              <BarList
                rows={d.items.map((i) => ({ label: i.item, n: i.seen, sub: `из ${i.viewerDays}` }))}
                empty="Блоки не размечены или их не видели."
              />
            </div>
          </Block>
          <Block title="Версии приложения · 28 дней" className="md:col-span-2">
            {d.versions.length === 0 ? (
              <p className="text-xs text-slate-600">Нет данных по версиям.</p>
            ) : (
              <div className="panel overflow-x-auto rounded-lg">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="border-b border-white/10 text-[11px] text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Версия</th>
                      <th className="px-3 py-2 font-medium">Показы</th>
                      <th className="px-3 py-2 font-medium">Быстрый уход</th>
                      <th className="px-3 py-2 font-medium">Мимо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.versions.map((v) => (
                      <tr key={v.appVersion} className="border-b border-white/5 last:border-b-0">
                        <td className="px-3 py-1.5 font-mono text-slate-200">{v.appVersion}</td>
                        <td className="px-3 py-1.5 text-slate-300">{num(v.views)}</td>
                        <td className="px-3 py-1.5 text-slate-300">{num(v.quickBack)}</td>
                        <td className="px-3 py-1.5 text-slate-300">{num(v.deadTaps)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Block>
        </div>
      </div>
    </div>
  );
}
