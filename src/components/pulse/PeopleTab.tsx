import { useState } from "react";
import { Link } from "react-router-dom";
import { getPulseJourney, getPulseJourneys } from "../../lib/api";
import type { PulseJourney, PulseJourneyItem } from "../../lib/pulse-types";
import { ago, dateTime, day, duration, platformLabel, shortId } from "../../lib/pulse-format";
import { useLoad } from "../../lib/useLoad";
import UserProfileDrawer from "../users/UserProfileDrawer";
import { Empty, FreshnessLine, InlineError, Loading, Segmented } from "./ui";

type Mode = "stuck" | "recent";

const PHASE_LABEL = { onboarding: "анкета", date: "свидание" } as const;

const TH = "px-3 py-2 font-medium whitespace-nowrap";
const TD = "px-3 py-2 whitespace-nowrap tabular-nums";

function JourneyRow({ j, onOpen }: { j: PulseJourney; onOpen: () => void }) {
  const last = j.items[j.items.length - 1];
  return (
    <tr onClick={onOpen} className="cursor-pointer border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]">
      <td className={`${TD} font-mono text-[11px] text-slate-300`}>{shortId(j.userId)}</td>
      <td className={`${TD} text-slate-400`}>{platformLabel(j.platform)}</td>
      <td className={`${TD} text-slate-400`}>{day(j.signupDate)}</td>
      <td className={`${TD} text-slate-200`}>
        {j.stuck ? j.stuck.whereTitle : last?.screen ?? "—"}
        {j.stuck && <span className="ml-2 text-[11px] text-slate-500">{PHASE_LABEL[j.stuck.phase]}</span>}
      </td>
      <td className={`${TD} text-slate-300`}>{j.stuck ? ago(j.stuck.since) : last ? ago(last.at) : "—"}</td>
    </tr>
  );
}

/** Kind marker: screen = hollow ring, tap cluster = amber dot, server milestone = white diamond. */
function KindMark({ kind }: { kind: PulseJourneyItem["kind"] }) {
  const mark =
    kind === "server_milestone" ? (
      <span className="h-2 w-2 rotate-45 bg-slate-200" title="Событие на сервере" />
    ) : kind === "tap_cluster" ? (
      <span className="h-2 w-2 rounded-full bg-amber-400/90" title="Серия касаний" />
    ) : (
      <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-400" title="Экран" />
    );
  return <span className="flex h-4 w-3 shrink-0 items-center justify-center">{mark}</span>;
}

const KIND_LABEL: Record<PulseJourneyItem["kind"], string> = {
  screen: "экран",
  tap_cluster: "касания",
  server_milestone: "сервер",
};

function Timeline({ userId, onBack }: { userId: string; onBack: () => void }) {
  const res = useLoad(`journey:${userId}`, () => getPulseJourney(userId));
  const [drawer, setDrawer] = useState(false);
  const back = (
    <button type="button" onClick={onBack} className="btn cursor-pointer rounded-md px-2.5 py-1 text-xs">
      ← Все люди
    </button>
  );
  if (res.loading) return <div className="space-y-3">{back}<Loading /></div>;
  if (res.error || !res.data)
    return <div className="space-y-3">{back}<InlineError message={res.error ?? "пустой ответ"} /></div>;

  const j = res.data.journey;
  // Day headers: the feed spans up to 35 days, a bare time is ambiguous.
  const localDay = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  const rows = j.items.map((it, idx) => ({
    it,
    d: localDay(it.at),
    header: idx === 0 || localDay(it.at) !== localDay(j.items[idx - 1].at),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        {back}
        <div className="min-w-0 flex-1">
          <code className="font-mono text-xs text-slate-200">{j.userId}</code>
          <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
            {platformLabel(j.platform)} · регистрация {day(j.signupDate)}
            {j.stuck && (
              <>
                {" · "}
                <span className="text-amber-300">
                  стоит на «{j.stuck.whereTitle}» ({PHASE_LABEL[j.stuck.phase]}) с {dateTime(j.stuck.since)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setDrawer(true)} className="btn cursor-pointer rounded-md px-2.5 py-1 text-xs">
            Карточка
          </button>
          <Link to={`/users/${j.userId}`} className="btn rounded-md px-2.5 py-1 text-xs">
            Диалог →
          </Link>
        </div>
      </div>

      {j.items.length === 0 ? (
        <Empty title="Пусто">Нет ни экранов, ни серверных событий за 35 дней.</Empty>
      ) : (
        <ol className="panel relative rounded-lg px-4 py-3">
          {j.truncated && <li className="pb-2 text-[11px] text-slate-600">… ранние пункты скрыты (до 200 последних)</li>}
          {rows.map(({ it, d, header }, idx) => {
            return (
              <li key={idx}>
                {header && (
                  <p className="pt-2 pb-1 text-[11px] font-medium text-slate-500 tabular-nums">{d}</p>
                )}
                <div className="flex gap-3 border-l border-white/10 py-1.5 pl-3">
                  <KindMark kind={it.kind} />
                  <span className="w-11 shrink-0 text-[11px] text-slate-500 tabular-nums">
                    {new Date(it.at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="min-w-0 flex-1 text-xs text-slate-200">{it.label}</span>
                  <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                    {it.dwellMs != null ? duration(it.dwellMs) : KIND_LABEL[it.kind]}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <UserProfileDrawer userId={drawer ? j.userId : null} onClose={() => setDrawer(false)} />
    </div>
  );
}

export default function PeopleTab({
  reloadToken,
  selected,
  onSelect,
}: {
  reloadToken: number;
  selected: string | null;
  onSelect: (userId: string | null) => void;
}) {
  const force = reloadToken > 0;
  const [mode, setMode] = useState<Mode>("stuck");
  const list = useLoad(selected ? null : `journeys:${mode}:${reloadToken}`, () =>
    getPulseJourneys({ stuck: mode === "stuck", limit: 50 }, force),
  );

  if (selected) return <Timeline userId={selected} onBack={() => onSelect(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {list.data ? <FreshnessLine f={list.data.dataFreshness} /> : <span />}
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "stuck", label: "Застряли > 48 ч" },
            { value: "recent", label: "Недавно активные" },
          ]}
        />
      </div>

      {list.loading ? (
        <Loading />
      ) : list.error || !list.data ? (
        <InlineError message={list.error ?? "пустой ответ"} />
      ) : list.data.journeys.length === 0 ? (
        <Empty title={mode === "stuck" ? "Никто не застрял" : "Нет недавно активных"} />
      ) : (
        <div className="panel overflow-x-auto rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-[11px] text-slate-500">
              <tr>
                <th className={TH}>ID</th>
                <th className={TH}>Платформа</th>
                <th className={TH}>Регистрация</th>
                <th className={TH}>{mode === "stuck" ? "Где стоит" : "Последний экран"}</th>
                <th className={TH}>{mode === "stuck" ? "Стоит с" : "Активность"}</th>
              </tr>
            </thead>
            <tbody>
              {list.data.journeys.map((j) => (
                <JourneyRow key={j.userId} j={j} onOpen={() => onSelect(j.userId)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
