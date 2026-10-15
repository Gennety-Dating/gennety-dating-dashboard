/** Russian formatting for the Pulse tabs. Pure functions, no React. */

const nf = new Intl.NumberFormat("ru-RU");

export function num(n: number | null | undefined): string {
  return n == null ? "—" : nf.format(n);
}

export function pct(share: number | null | undefined, digits = 0): string {
  if (share == null) return "—";
  return `${(share * 100).toFixed(digits).replace(".", ",")}%`;
}

export function usd(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 400 → «0,4 с», 12 000 → «12 с», 125 000 → «2 мин 5 с», 3 900 000 → «1 ч 5 мин». */
export function duration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${(ms / 1000).toFixed(1).replace(".", ",")} с`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m} мин ${s % 60} с` : `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 48) return m % 60 ? `${h} ч ${m % 60} мин` : `${h} ч`;
  return `${Math.floor(h / 24)} дн`;
}

/** Age of an ISO timestamp: «только что», «12 мин назад», «5 ч назад», «3 дн назад». */
export function ago(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "никогда";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const min = Math.max(0, Math.round((now - t) / 60_000));
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}

/** «14.10, 19:02» in the viewer's local time. */
export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `YYYY-MM-DD` → «09.10». UTC days, so no timezone shift. */
export function day(key: string | null | undefined): string {
  if (!key) return "—";
  const [, m, d] = key.split("-");
  return d && m ? `${d}.${m}` : key;
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export const PLATFORM_LABEL: Record<string, string> = {
  ios: "iOS",
  miniapp: "Mini App",
  bot: "Бот",
};

export function platformLabel(p: string | null | undefined): string {
  if (!p) return "—";
  return PLATFORM_LABEL[p] ?? p;
}
