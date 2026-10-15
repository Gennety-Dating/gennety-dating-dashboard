/**
 * The Analytics page's navigation, kept out of the component files so they
 * export components only. The active tab lives in the URL (`?tab=`, `?g=`,
 * `?screen=`, `?user=`) so a view can be linked and screenshotted.
 */

export type TabKey = "summary" | "screens" | "people" | "growth";

/** «Сводка» first: it is the default and where every reading starts. */
export const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "summary", label: "Сводка" },
  { key: "screens", label: "Экраны" },
  { key: "people", label: "Люди" },
  { key: "growth", label: "Рост и деньги" },
];

export type GrowthSub =
  | "funnels"
  | "core"
  | "retention"
  | "money"
  | "virality"
  | "audience"
  | "gender"
  | "cities"
  | "algorithm";

export const GROWTH_SUBS: Array<{ key: GrowthSub; label: string }> = [
  { key: "funnels", label: "Воронки и активность" },
  { key: "core", label: "Ключевые" },
  { key: "retention", label: "Удержание и доверие" },
  { key: "money", label: "Деньги" },
  { key: "virality", label: "Виральность" },
  { key: "audience", label: "Аудитория" },
  { key: "gender", label: "Гендер" },
  { key: "cities", label: "Города" },
  { key: "algorithm", label: "Алгоритм и пары" },
];

export type PulseWindow = "d7" | "d28";
