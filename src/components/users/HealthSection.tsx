import type { AdminStatsData, UserHealthClass } from "../../lib/api";
import { HEALTH_LABELS, HEALTH_STYLES } from "../../lib/health";

/**
 * «Здоровье базы» — секция над списком юзеров.
 *
 * Все числа приходят из `/admin/stats` уже посчитанными: дашборд ничего не
 * пересчитывает сам, иначе UI и Hermes однажды разойдутся в том, что считать
 * живым аккаунтом.
 */

const KPI_ORDER: UserHealthClass[] = [
  "live",
  "stuck_onboarding",
  "cold_open_unengaged",
  "suspicious",
  "test",
];

function HealthCard({
  cls,
  count,
  total,
  hint,
}: {
  cls: UserHealthClass;
  count: number;
  total: number;
  hint: string;
}) {
  const share = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="glass-card-borderless rounded-3xl p-5" title={hint}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${HEALTH_STYLES[cls]}`}
        >
          {HEALTH_LABELS[cls]}
        </span>
        <span className="text-[10px] font-semibold text-slate-500">{share}%</span>
      </div>
      <p className="mt-2.5 text-3xl font-black tracking-tight text-white">{count}</p>
    </div>
  );
}

/** Одна ступень воронки: полоса пропорциональной длины + просадка к предыдущей. */
function FunnelStep({
  label,
  value,
  base,
  previous,
}: {
  label: string;
  value: number;
  base: number;
  previous?: number;
}) {
  const width = base > 0 ? Math.max((value / base) * 100, 2) : 0;
  const drop =
    previous !== undefined && previous > 0
      ? Math.round(((previous - value) / previous) * 100)
      : null;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {label}
        </span>
        <span className="text-xs font-semibold text-slate-300">
          <span className="font-black text-white">{value}</span>
          {drop !== null && drop > 0 && (
            <span className="ml-2 text-[11px] font-bold text-rose-300/80">−{drop}%</span>
          )}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#17181c]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500/70 to-rose-300/70"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function HealthSection({
  stats,
  loading,
}: {
  stats: AdminStatsData | null;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card-borderless h-28 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  const { userHealth, funnel } = stats;
  const eligible = userHealth.matchmaking_eligible;
  const cfg = userHealth.config;

  const hints: Record<UserHealthClass, string> = {
    live: "Активен, верифицирован, писал за последние " + cfg.inactive_days + " дн., есть фото",
    stuck_onboarding: "Реальный человек: писал боту, но не закончил онбординг",
    cold_open_unengaged:
      "Открыл бота и ушёл: ни одного сообщения спустя " + cfg.cold_open_hours + " ч",
    inactive: "Был активен, молчит дольше " + cfg.inactive_days + " дн.",
    suspicious:
      "Сработало правило фрода (>" +
      cfg.suspicious_min_messages +
      " сообщений без верификации, фото без сверки лица, ответы быстрее " +
      cfg.suspicious_max_response_sec +
      " с, пачка регистраций). Флаг для ручного разбора — ничего не заблокировано",
    test: "Тестовый аккаунт. Исключён из всех знаменателей",
    other: "Не попал ни в один класс: paused/frozen/banned или регистрация моложе суток",
  };

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-extrabold tracking-tight text-white">Здоровье базы</h2>
        <p className="text-[11px] font-medium text-slate-500">
          {userHealth.real} реальных из {userHealth.total} аккаунтов
          {userHealth.truncated && " · скан ограничен, цифры частичные"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {KPI_ORDER.map((cls) => (
          <HealthCard
            key={cls}
            cls={cls}
            count={userHealth.byClass[cls] ?? 0}
            total={userHealth.total}
            hint={hints[cls]}
          />
        ))}
      </div>

      {/* Ликвидность — единственное число, которое отвечает «есть ли кого сводить». */}
      <div className="glass-card-borderless mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl px-5.5 py-4">
        <div className="text-xs font-medium text-slate-300">
          Готовы к матчингу:{" "}
          <span className="text-base font-black text-white">{eligible.count}</span>
          <span className="text-slate-500"> из {eligible.of_total}</span>
          <span className="ml-2 text-[11px] text-slate-500">
            (реальные пользователи, без тестовых)
          </span>
        </div>
        {userHealth.byClass.suspicious > 0 && (
          <div className="text-[11px] font-semibold text-rose-300/80">
            {userHealth.byClass.suspicious} помечено как подозрительные — ничего не
            заблокировано, нужен ручной разбор
          </div>
        )}
      </div>

      {/* Воронка онбординга. Знаменатель везде — реальные пользователи. */}
      <div className="glass-card-borderless mt-4 rounded-3xl p-5.5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Воронка онбординга
          </h3>
          <p className="text-[11px] font-medium text-slate-500">
            рег → активный:{" "}
            <span className="font-bold text-white">
              {funnel.conversion_registered_to_active_pct ?? "—"}%
            </span>
            <span className="mx-2 text-slate-700">|</span>
            consent → активный:{" "}
            <span className="font-bold text-white">
              {funnel.conversion_consent_to_active_pct ?? "—"}%
            </span>
          </p>
        </div>

        <div className="space-y-3.5">
          <FunnelStep
            label="Зарегистрировано (реальных)"
            value={funnel.registered_real}
            base={funnel.registered_real}
          />
          <FunnelStep
            label="Дали согласие"
            value={funnel.gave_consent}
            base={funnel.registered_real}
            previous={funnel.registered_real}
          />
          <FunnelStep
            label="Завершили онбординг"
            value={funnel.completed_onboarding}
            base={funnel.registered_real}
            previous={funnel.gave_consent}
          />
          <FunnelStep
            label="Активные и верифицированные"
            value={funnel.active_verified}
            base={funnel.registered_real}
            previous={funnel.completed_onboarding}
          />
        </div>
      </div>
    </div>
  );
}
