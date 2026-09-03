import type { CityCatalogEntry, CityStatus, WaitlistData } from "../../lib/api";

export type CityStatusFilter = CityStatus | "none" | "";

/**
 * Фильтр списка пользователей по городу.
 *
 * Два независимых среза, а не один: статус («кого мы вообще можем метчить»)
 * и конкретный город («сколько их в Берлине»). Founder читает их порознь —
 * «покажи всех, кто ждёт» и «покажи Берлин» это разные вопросы.
 *
 * Каталог приходит с сервера (`/admin/cities`), а не зашит здесь: список
 * городов, живущий в двух репозиториях, рано или поздно разойдётся сам с
 * собой. Пока каталог не загрузился, показываем только срез по статусу —
 * пустой `select` с одним «Все города» честнее, чем выдуманный список.
 *
 * Счётчик ожидающих рядом с городом — из `/admin/analytics/waitlist`: он
 * отвечает на «а стоит ли туда идти» до того, как админ применит фильтр.
 */
export default function CityFilter({
  catalog,
  waitlist,
  cityKey,
  cityStatus,
  onCityKeyChange,
  onCityStatusChange,
}: {
  catalog: CityCatalogEntry[];
  waitlist: WaitlistData | null;
  cityKey: string;
  cityStatus: CityStatusFilter;
  onCityKeyChange: (next: string) => void;
  onCityStatusChange: (next: CityStatusFilter) => void;
}) {
  const waitingBy = new Map(
    (waitlist?.cities ?? []).map((row) => [row.cityKey, row.total] as const),
  );

  // Страны идут теми же непрерывными блоками, в которых их прислал сервер, —
  // порядок принадлежит каталогу, и новая страна не требует правки здесь.
  const groups: Array<{ countryCode: string; cities: CityCatalogEntry[] }> = [];
  for (const city of catalog) {
    const last = groups[groups.length - 1];
    if (last && last.countryCode === city.countryCode) last.cities.push(city);
    else groups.push({ countryCode: city.countryCode, cities: [city] });
  }

  const STATUSES: Array<{ value: CityStatusFilter; label: string }> = [
    { value: "", label: "Все" },
    { value: "active", label: "Запущенные" },
    { value: "waitlist", label: "Лист ожидания" },
    { value: "none", label: "Без города" },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-[#17181c] p-1.5 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">
        {STATUSES.map((status) => {
          const isActive = cityStatus === status.value;
          return (
            <button
              key={status.value || "any"}
              onClick={() => onCityStatusChange(status.value)}
              className={`${
                isActive
                  ? "inner-glow-cherry text-white"
                  : "inner-glow text-slate-300 hover:text-white"
              } cursor-pointer rounded-xl px-3.5 py-2 text-[11px] font-bold tracking-wide`}
            >
              {status.label}
              {status.value === "waitlist" && waitlist && (
                <span className={`ml-1.5 ${isActive ? "text-white/70" : "text-slate-500"}`}>
                  {waitlist.totalWaiting}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <select
        value={cityKey}
        onChange={(e) => onCityKeyChange(e.target.value)}
        className="inner-glow cursor-pointer rounded-2xl bg-[#17181c] px-4 py-2.5 text-[11px] font-semibold text-slate-200 outline-none hover:text-white"
      >
        <option value="">Все города</option>
        {groups.map((group) => (
          <optgroup key={group.countryCode} label={group.countryCode}>
            {group.cities.map((city) => (
              <option key={city.cityKey} value={city.cityKey}>
                {city.city}
                {city.status === "waitlist"
                  ? ` · ждут ${waitingBy.get(city.cityKey) ?? 0}`
                  : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
