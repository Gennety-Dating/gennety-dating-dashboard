import type { AdminStatsData, UserHealthClass } from "../../lib/api";
import { HEALTH_LABELS } from "../../lib/health";

export type HealthTab = UserHealthClass | "all";

const TABS: HealthTab[] = [
  "all",
  "live",
  "stuck_onboarding",
  "cold_open_unengaged",
  "inactive",
  "suspicious",
  "test",
  "other",
];

/**
 * Вкладки по классу здоровья + переключатель тестовых аккаунтов.
 *
 * Счётчик на вкладке берётся из `/admin/stats`, а не из длины текущей
 * страницы: список пагинированный, и «Живые (5)» должно значить пять в базе,
 * а не пять на этом экране.
 */
export default function HealthTabs({
  active,
  onChange,
  includeTest,
  onIncludeTestChange,
  stats,
}: {
  active: HealthTab;
  onChange: (tab: HealthTab) => void;
  includeTest: boolean;
  onIncludeTestChange: (next: boolean) => void;
  stats: AdminStatsData | null;
}) {
  const counts = stats?.userHealth.byClass;
  const total = stats?.userHealth.total ?? 0;

  function countFor(tab: HealthTab): number | null {
    if (!counts) return null;
    if (tab === "all") return includeTest ? total : total - (counts.test ?? 0);
    return counts[tab] ?? 0;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-[#17181c] p-1.5 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">
        {TABS.map((tab) => {
          // Вкладка «Тестовые» бессмысленна, когда тестовые скрыты.
          if (tab === "test" && !includeTest) return null;
          const count = countFor(tab);
          const isActive = active === tab;
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className={`${
                isActive ? "inner-glow-cherry text-white" : "inner-glow text-slate-300 hover:text-white"
              } cursor-pointer rounded-xl px-3.5 py-2 text-[11px] font-bold tracking-wide`}
            >
              {tab === "all" ? "Все" : HEALTH_LABELS[tab]}
              {count !== null && (
                <span className={`ml-1.5 ${isActive ? "text-white/70" : "text-slate-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-slate-200">
        <input
          type="checkbox"
          checked={includeTest}
          onChange={(e) => onIncludeTestChange(e.target.checked)}
          className="h-3.5 w-3.5 cursor-pointer accent-rose-500"
        />
        Показывать тестовые аккаунты
      </label>
    </div>
  );
}
