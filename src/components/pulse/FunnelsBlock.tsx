import { useState } from "react";
import { getPulseFunnels } from "../../lib/api";
import type { PulseFunnel } from "../../lib/pulse-types";
import { day, num, pct } from "../../lib/pulse-format";
import { useLoad } from "../../lib/useLoad";
import type { PulseWindow } from "../../lib/analytics-tabs";
import { Block, InlineError, Loading, Segmented, SmallSample } from "./ui";

const MONEY_LABEL: Record<string, string> = {
  paywall: "Пейвол",
  ticket_gate: "Билет",
};

function moneyLabel(dim: string): string {
  const [kind, surface] = dim.split(":");
  return `${MONEY_LABEL[kind] ?? kind}${surface ? ` · ${surface}` : ""}`;
}

/**
 * One funnel as stacked bars. Each step's bar is relative to the first step;
 * the right column is the step-to-step pass rate — or, under n < 30, the
 * absolute «6 из 11» the API's null conversion asks for.
 */
function FunnelCard({ f, w }: { f: PulseFunnel; w: PulseWindow }) {
  const first = f.steps[0]?.[w] ?? 0;
  const entered = w === "d7" ? f.enteredD7 : f.enteredD28;
  return (
    <div className="panel rounded-lg p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-[13px] font-medium text-slate-100">{f.title}</h3>
        <span className="text-[11px] text-slate-500 tabular-nums">вошли: {num(entered)}</span>
        {f.smallSample && <SmallSample />}
      </div>
      <ul className="space-y-1">
        {f.steps.map((s, i) => {
          const v = s[w];
          const prev = i > 0 ? f.steps[i - 1][w] : null;
          const conv = w === "d7" ? s.conversionD7 : s.conversionD28;
          const drop = prev != null ? prev - v : 0;
          return (
            <li key={s.step} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-xs">
              <span className="truncate text-slate-300" title={s.step}>
                {s.title}
              </span>
              <span className="relative h-4 rounded-sm bg-white/[0.03]">
                <span
                  className="absolute inset-y-0 left-0 rounded-sm bg-slate-400/35"
                  style={{ width: `${first > 0 ? (v / first) * 100 : 0}%` }}
                />
                <span className="relative pl-1.5 text-[11px] leading-4 text-slate-200 tabular-nums">{num(v)}</span>
              </span>
              <span className="w-24 text-right text-[11px] text-slate-500 tabular-nums">
                {i === 0
                  ? ""
                  : conv != null
                    ? `${pct(conv)}${drop > 0 ? ` · −${drop}` : ""}`
                    : `${num(v)} из ${num(prev)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function FunnelsBlock({ reloadToken }: { reloadToken: number }) {
  const force = reloadToken > 0;
  const [w, setW] = useState<PulseWindow>("d7");
  const res = useLoad(`funnels:${reloadToken}`, () => getPulseFunnels(force));

  return (
    <Block
      title="Воронки Pulse"
      hint="iOS и Mini App — экраны клиента, только люди с согласием на аналитику. Бот и серверная анкета iOS — все люди. Свидание — пары по дню создания (молодые когорты дозревают). Человек считается в шаге один раз, в день первого достижения."
      right={
        <Segmented
          value={w}
          onChange={setW}
          options={[
            { value: "d7", label: "7 дней" },
            { value: "d28", label: "28 дней" },
          ]}
        />
      }
    >
      {res.loading ? (
        <Loading />
      ) : res.error || !res.data ? (
        <InlineError message={res.error ?? "пустой ответ"} />
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-600">по {day(res.data.asOf)} включительно, UTC</p>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {res.data.funnels.map((f) => (
              <FunnelCard key={f.id} f={f} w={w} />
            ))}
          </div>
          {res.data.money.length > 0 && (
            <div className="panel overflow-x-auto rounded-lg">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="border-b border-white/10 text-[11px] text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Платный шаг · 7 дней</th>
                    <th className="px-3 py-2 font-medium">Показан</th>
                    <th className="px-3 py-2 font-medium">Закрыли</th>
                  </tr>
                </thead>
                <tbody>
                  {res.data.money.map((m) => (
                    <tr key={m.dim} className="border-b border-white/5 last:border-b-0">
                      <td className="px-3 py-1.5 text-slate-200">{moneyLabel(m.dim)}</td>
                      <td className="px-3 py-1.5 text-slate-300">{num(m.shown)}</td>
                      <td className="px-3 py-1.5 text-slate-300">{num(m.dismissed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Block>
  );
}
