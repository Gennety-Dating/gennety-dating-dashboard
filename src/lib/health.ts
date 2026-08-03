import type { UserHealthClass } from "./api";

/**
 * Подписи и цвета классов здоровья аккаунта.
 *
 * Живут отдельно от компонентов намеренно: их читают и секция «Здоровье базы»,
 * и вкладки, и бейдж в таблице, а файл с компонентом не должен экспортировать
 * ничего кроме компонента (иначе ломается fast refresh).
 */
export const HEALTH_LABELS: Record<UserHealthClass, string> = {
  live: "Живые",
  stuck_onboarding: "Застряли",
  cold_open_unengaged: "Зашли и ушли",
  inactive: "Остыли",
  suspicious: "Подозрительные",
  test: "Тестовые",
  other: "Прочие",
};

/** Цвет несёт смысл: зелёный — рабочий, янтарный — терять, розовый — фрод. */
export const HEALTH_STYLES: Record<UserHealthClass, string> = {
  live: "bg-emerald-500/15 text-emerald-300",
  stuck_onboarding: "bg-amber-500/15 text-amber-300",
  cold_open_unengaged: "bg-sky-500/15 text-sky-300",
  inactive: "bg-slate-400/15 text-slate-300",
  suspicious: "bg-rose-500/15 text-rose-300",
  test: "bg-violet-500/15 text-violet-300",
  other: "bg-white/10 text-slate-400",
};
