import { useMemo, useState } from "react";
import { getPulseScreens } from "../../lib/api";
import type { PulsePlatform, PulseScreenSummary } from "../../lib/pulse-types";
import { duration, num } from "../../lib/pulse-format";
import { useLoad } from "../../lib/useLoad";
import ScreenDetail from "./ScreenDetail";
import type { PulseWindow } from "../../lib/analytics-tabs";
import { Empty, FreshnessLine, FrictionValue, InlineError, Loading, Segmented } from "./ui";

type PlatformFilter = "all" | PulsePlatform;

const TH = "px-3 py-2 font-medium whitespace-nowrap";
const TD = "px-3 py-2 tabular-nums whitespace-nowrap";

function ScreenRow({
  s,
  w,
  onOpen,
}: {
  s: PulseScreenSummary;
  w: PulseWindow;
  onOpen: () => void;
}) {
  const m = s[w];
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]"
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-100">{s.title}</span>
          {!s.known && (
            <span className="rounded border border-white/10 px-1 text-[10px] text-slate-500">
              нет в реестре
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-slate-600">{s.screen}</span>
      </td>
      <td className={TD}>
        <FrictionValue value={m.friction} />
      </td>
      <td className={`${TD} text-slate-300`}>
        {num(m.views)}
        {m.smallSample && m.views > 0 && (
          <span className="ml-1 text-[10px] text-amber-300/80" title="Меньше 30 показов">
            •
          </span>
        )}
      </td>
      <td className={`${TD} text-slate-300`}>{duration(m.dwellP50Ms)}</td>
      <td className={`${TD} text-slate-500`}>{duration(m.dwellP90Ms)}</td>
      <td className={`${TD} text-slate-300`}>{num(m.quickBack)}</td>
      <td className={`${TD} text-slate-300`}>{num(m.deadTaps)}</td>
      <td className={`${TD} text-slate-300`}>{num(m.rageTaps)}</td>
      <td className={`${TD} text-slate-300`}>{num(m.exits)}</td>
    </tr>
  );
}

export default function ScreensTab({
  reloadToken,
  selected,
  onSelect,
}: {
  reloadToken: number;
  selected: string | null;
  onSelect: (screen: string | null) => void;
}) {
  const force = reloadToken > 0;
  const [win, setWin] = useState<PulseWindow>("d7");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const list = useLoad(selected ? null : `screens:${reloadToken}`, () => getPulseScreens(force));

  const rows = useMemo(() => {
    const all = list.data?.screens ?? [];
    return all
      .filter((s) => platform === "all" || s.platform === platform)
      .filter((s) => s[win].views > 0)
      .sort(
        (a, b) =>
          (b[win].friction ?? -1) - (a[win].friction ?? -1) || b[win].views - a[win].views,
      );
  }, [list.data, platform, win]);

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        value={win}
        onChange={setWin}
        options={[
          { value: "d7", label: "7 дней" },
          { value: "d28", label: "28 дней" },
        ]}
      />
      {!selected && (
        <Segmented
          value={platform}
          onChange={setPlatform}
          options={[
            { value: "all", label: "Все" },
            { value: "ios", label: "iOS" },
            { value: "miniapp", label: "Mini App" },
          ]}
        />
      )}
    </div>
  );

  if (selected) {
    return (
      <ScreenDetail
        screen={selected}
        win={win}
        controls={controls}
        reloadToken={reloadToken}
        onBack={() => onSelect(null)}
      />
    );
  }

  if (list.loading) return <Loading />;
  if (list.error || !list.data) return <InlineError message={list.error ?? "пустой ответ"} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FreshnessLine f={list.data.dataFreshness} />
        {controls}
      </div>

      {rows.length === 0 ? (
        <Empty title="Нет экранов с показами за этот период">
          Экранные данные идут только от людей с согласием на аналитику.
        </Empty>
      ) : (
        <div className="panel overflow-x-auto rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-[11px] text-slate-500">
              <tr>
                <th className={TH}>Экран</th>
                <th className={TH} title="0,35·ярость + 0,25·мимо + 0,2·быстрый уход + 0,2·сворачивание на 100 показов">
                  Трение
                </th>
                <th className={TH}>Показы</th>
                <th className={TH}>Время p50</th>
                <th className={TH}>p90</th>
                <th className={TH} title="Назад меньше чем через 2 с">
                  Быстрый уход
                </th>
                <th className={TH} title="Касания мимо элементов">
                  Мимо
                </th>
                <th className={TH} title="≥3 касания за 1 с в одном месте">
                  Ярость
                </th>
                <th className={TH} title="Свернули приложение прямо с экрана">
                  Сворачивания
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <ScreenRow key={s.screen} s={s} w={win} onOpen={() => onSelect(s.screen)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate-600">
        <span className="text-amber-300/80">•</span> меньше 30 показов — смотрите на счётчики, не на
        доли.
      </p>
    </div>
  );
}
