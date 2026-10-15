import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getActivitySeries } from "../../lib/api";
import { TOOLTIP_STYLE } from "../../lib/chartTheme";
import { day, num, platformLabel } from "../../lib/pulse-format";
import { useLoad } from "../../lib/useLoad";
import { Block, InlineError, Loading } from "./ui";

const AXIS = { fill: "#64748b", fontSize: 10 } as const;

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel rounded-lg px-3 py-2.5">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="truncate text-[11px] text-slate-500 tabular-nums">{sub}</p>}
    </div>
  );
}

function split(by: Record<string, number>): string {
  return Object.entries(by)
    .sort((a, b) => b[1] - a[1])
    .map(([p, n]) => `${platformLabel(p)} ${n}`)
    .join(" · ");
}

/** DAU over the last 30 days (ending yesterday, UTC) + DAU/WAU/MAU headline. */
export default function ActivityBlock({ reloadToken }: { reloadToken: number }) {
  const force = reloadToken > 0;
  const res = useLoad(`active:${reloadToken}`, () => getActivitySeries(force));

  return (
    <Block
      title="Активность · DAU / MAU"
      hint="Уникальные настоящие аккаунты за день (UTC). По умолчанию — вчера: сегодняшний день ещё набирается. WAU — 7 дней, MAU — 30 дней, липкость = DAU ÷ MAU."
    >
      {res.loading ? (
        <Loading />
      ) : res.error || !res.data ? (
        <InlineError message={res.error ?? "пустой ответ"} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,18rem)_1fr]">
          <div className="grid grid-cols-2 gap-2">
            <Tile label={`DAU · ${day(res.data.summary.date)}`} value={num(res.data.summary.dau)} sub={split(res.data.summary.dauByPlatform)} />
            <Tile label="WAU" value={num(res.data.summary.wau)} />
            <Tile label="MAU" value={num(res.data.summary.mau)} sub={split(res.data.summary.mauByPlatform)} />
            <Tile
              label="Липкость"
              value={res.data.summary.stickinessPct == null ? "—" : `${res.data.summary.stickinessPct.toFixed(1).replace(".", ",")}%`}
            />
          </div>
          <div className="panel rounded-lg p-3">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={res.data.series.map((s) => ({ ...s, label: day(s.date) }))}
                  margin={{ top: 6, right: 6, bottom: 0, left: -24 }}
                >
                  <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area
                    dataKey="dau"
                    name="DAU"
                    stroke="#cbd5e1"
                    fill="#cbd5e1"
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Block>
  );
}
