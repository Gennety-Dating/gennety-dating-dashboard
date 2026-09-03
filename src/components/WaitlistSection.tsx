import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { WaitlistData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";
import ChartCard from "./charts/ChartCard";

const TOOLTIP_STYLE = {
  backgroundColor: "#17181c",
  border: "none",
  borderRadius: 12,
  color: "#ffffff",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
};

interface Props {
  data: WaitlistData | null;
  loading: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Спрос на города, которые мы ещё не открыли.
 *
 * Это НЕ «City distribution» сверху и не должно с ней складываться: та
 * распределяет существующую базу по городам, где мы работаем, а здесь люди,
 * которых мы не можем смэтчить ни с кем — регистрация у них остановлена на
 * экране ожидания. «Сколько человек мы обслуживаем в Киеве» и «сколько человек
 * ждут Берлин» — два разных числа, и решения они двигают разные.
 *
 * Пустые города остаются в таблице намеренно: «в Дрездене пока никого» и
 * «Дрездена нет в списке расширения» — разные ответы, а таблица, которая
 * молча прячет нули, их не различает.
 */
export default function WaitlistSection({ data, loading }: Props) {
  const cities = data?.cities ?? [];
  const withDemand = cities.filter((c) => c.total > 0);
  const chartData = withDemand.map((c) => ({
    name: `${c.city} (${c.countryCode})`,
    Female: c.female,
    Male: c.male,
    Unknown: c.unknown,
  }));
  const top = withDemand[0] ?? null;

  return (
    <section className="space-y-8">
      <SectionHeader
        title="City waitlist"
        description="People who picked a city we haven't opened yet. Their registration stops at the waitlist screen — they have no matching city and appear nowhere in City distribution above."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Waiting"
          value={loading ? "…" : (data?.totalWaiting ?? 0).toLocaleString()}
          accent
        />
        <StatCard
          label="Cities with demand"
          value={loading ? "…" : withDemand.length.toLocaleString()}
          sub={`of ${cities.length} on the expansion list`}
          info="Cities with at least one person waiting. The rest are offered in the picker and nobody has chosen them yet."
        />
        <StatCard
          label="Most wanted"
          value={loading ? "…" : (top?.city ?? "—")}
          sub={top ? `${top.total} waiting` : undefined}
          info="The city the most people have asked for. This is the demand signal behind 'which market opens next' — it is not a queue and nobody holds a position in it."
        />
        <StatCard
          label="Newest signup"
          value={
            loading
              ? "…"
              : formatDate(
                  cities.reduce<string | null>(
                    (latest, c) =>
                      c.lastJoinedAt && (!latest || c.lastJoinedAt > latest)
                        ? c.lastJoinedAt
                        : latest,
                    null,
                  ),
                )
          }
          info="When the most recent person joined any city's waitlist. A stale date means the picker is no longer bringing anyone in from outside our markets."
        />
      </div>

      {data && data.orphaned.length > 0 && (
        <div className="rounded-2xl bg-amber-950/40 p-4 text-xs font-medium text-amber-300 [box-shadow:inset_0_1px_1px_rgba(245,158,11,0.3)]">
          Есть записи на городах, которых больше нет в каталоге — обычно это
          город, который запустили, пока в нём кто-то ждал:{" "}
          {data.orphaned.map((o) => `${o.cityKey} (${o.total})`).join(", ")}. Их
          нужно перенести или удалить, они не видны ни в одной строке ниже.
        </div>
      )}

      <ChartCard
        title="Demand by city"
        description="Only cities somebody has actually asked for. A lopsided gender split here is the same warning it is in a launched market — it is what that city's first drop would have to work with."
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Nobody on the waitlist yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 38)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 110, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                width={110}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="Female" stackId="g" fill="#f43f5e" />
              <Bar dataKey="Male" stackId="g" fill="#be123c" />
              <Bar dataKey="Unknown" stackId="g" fill="#64748b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="Every city on the expansion list"
        description="Including the ones nobody has asked for — a zero here is an answer, not a missing row."
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : cities.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No expansion cities configured.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pr-4 text-left">City</th>
                  <th className="py-2 pr-4 text-right">Male</th>
                  <th className="py-2 pr-4 text-right">Female</th>
                  <th className="py-2 pr-4 text-right">Unknown</th>
                  <th className="py-2 pr-4 text-right">Waiting</th>
                  <th className="py-2 pr-4 text-right">First</th>
                  <th className="py-2 pr-4 text-right">Latest</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr
                    key={c.cityKey}
                    className={`border-b border-slate-800/40 ${
                      c.total > 0 ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    <td className="py-2 pr-4">
                      {c.city}
                      <span className="ml-1 text-xs text-slate-500">{c.countryCode}</span>
                    </td>
                    <td className="py-2 pr-4 text-right">{c.male}</td>
                    <td className="py-2 pr-4 text-right">{c.female}</td>
                    <td className="py-2 pr-4 text-right text-slate-500">{c.unknown}</td>
                    <td
                      className={`py-2 pr-4 text-right font-medium ${
                        c.total > 0 ? "text-white" : ""
                      }`}
                    >
                      {c.total}
                    </td>
                    <td className="py-2 pr-4 text-right text-slate-400">
                      {formatDate(c.firstJoinedAt)}
                    </td>
                    <td className="py-2 pr-4 text-right text-slate-400">
                      {formatDate(c.lastJoinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </section>
  );
}
