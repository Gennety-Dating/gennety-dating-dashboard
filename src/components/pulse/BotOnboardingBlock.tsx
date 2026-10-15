import { getOnboardingFunnel } from "../../lib/api";
import { duration, num, pct } from "../../lib/pulse-format";
import { useLoad } from "../../lib/useLoad";
import { Block, InlineError, Loading } from "./ui";

const TH = "px-3 py-2 font-medium whitespace-nowrap";
const TD = "px-3 py-1.5 whitespace-nowrap tabular-nums";

/**
 * The bot questionnaire step by step, all time: who reached each question,
 * who moved on, who is sitting on it right now, and how long they think.
 * Replaces the old Overview «funnel», which was a status snapshot.
 */
export default function BotOnboardingBlock({ reloadToken }: { reloadToken: number }) {
  const force = reloadToken > 0;
  const res = useLoad(`onb-funnel:${reloadToken}`, () => getOnboardingFunnel(force));

  return (
    <Block
      title="Анкета в боте · по вопросам"
      hint="За всё время, из событий шагов анкеты. «Отвал» — доля дошедших, кто не пошёл дальше. «Стоят» — ещё в анкете, и это их последний вопрос. Время — от вопроса до ответа или пропуска."
    >
      {res.loading ? (
        <Loading />
      ) : res.error || !res.data ? (
        <InlineError message={res.error ?? "пустой ответ"} />
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 tabular-nums">
            Начали: {num(res.data.usersEntered)} · ещё в анкете: {num(res.data.usersStillOnboarding)} ·
            закончили: {num(res.data.tail.finalizedOnboarding)} · прошли проверку лица:{" "}
            {num(res.data.tail.verified)}
          </p>
          <div className="panel overflow-x-auto rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-[11px] text-slate-500">
                <tr>
                  <th className={TH}>Вопрос</th>
                  <th className={TH}>Дошли</th>
                  <th className={TH}>Дальше</th>
                  <th className={TH}>Отвал</th>
                  <th className={TH}>Стоят</th>
                  <th className={TH}>Время p50</th>
                  <th className={TH}>p90</th>
                </tr>
              </thead>
              <tbody>
                {res.data.steps.map((s) => {
                  const small = s.reached < 30;
                  return (
                    <tr key={s.step} className="border-b border-white/5 last:border-b-0">
                      <td className={`${TD} font-mono text-[11px] text-slate-300`}>{s.step}</td>
                      <td className={`${TD} text-slate-300`}>{num(s.reached)}</td>
                      <td className={`${TD} text-slate-300`}>{num(s.advanced)}</td>
                      <td className={`${TD} text-slate-300`}>
                        {small ? `${num(s.reached - s.advanced)} из ${num(s.reached)}` : pct(s.dropOffRate)}
                      </td>
                      <td className={`${TD} ${s.stuckHere > 0 ? "text-amber-300" : "text-slate-500"}`}>
                        {num(s.stuckHere)}
                      </td>
                      <td className={`${TD} text-slate-300`}>{duration(s.dwellMsMedian)}</td>
                      <td className={`${TD} text-slate-500`}>{duration(s.dwellMsP90)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Block>
  );
}
