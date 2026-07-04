import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CitiesData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";
import ChartCard from "./charts/ChartCard";

const TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#f1f5f9",
};

interface Props {
  data: CitiesData;
}

const MAX_CHART_CITIES = 12;

export default function CitiesSection({ data }: Props) {
  const { totalUsers, attribution, cities } = data;

  const chartData = cities.slice(0, MAX_CHART_CITIES).map((c) => ({
    name: c.countryCode ? `${c.city} (${c.countryCode})` : c.city,
    Male: c.male,
    Female: c.female,
    Unknown: c.unknown,
  }));

  return (
    <section className="space-y-8">
      <SectionHeader
        title="City distribution"
        description="Male/female split per city. Users who have been on a date are placed by the departure point they marked heading out; everyone else by the city they're currently matched in."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={totalUsers.toLocaleString()} accent />
        <StatCard
          label="Cities"
          value={cities.filter((c) => c.cityKey !== "unknown").length.toLocaleString()}
          sub="with at least one user"
          info="Distinct known cities. The 'Unknown' bucket (no matching city and no departure pin) is excluded from this count but still shown in the table below."
        />
        <StatCard
          label="Placed by departure"
          value={attribution.byDeparture.toLocaleString()}
          sub={
            totalUsers > 0
              ? `${((attribution.byDeparture / totalUsers) * 100).toFixed(1)}% of users`
              : "—"
          }
          info="Users attributed to a city by the departure point they marked when heading out on a date (snapped to the nearest known city), rather than by their registered matching city."
        />
        <StatCard
          label="Placed by matching city"
          value={attribution.byMatchingCity.toLocaleString()}
          sub={
            attribution.unknown > 0
              ? `${attribution.unknown.toLocaleString()} unknown`
              : undefined
          }
          info="Users who have not marked a date departure point, attributed to their registered dating city (homeCityKey). 'Unknown' = neither a city nor a departure pin."
        />
      </div>

      <ChartCard
        title="Gender balance by city"
        description={`Stacked male/female (and unknown-gender) counts for the top ${MAX_CHART_CITIES} cities by user count. A lopsided bar means one side will struggle to find matches in that city.`}
      >
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No city data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 38)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 90, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                width={90}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="Female" stackId="g" fill="#ec4899" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Male" stackId="g" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Unknown" stackId="g" fill="#64748b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="All cities"
        description="Full breakdown. 'By departure' shows how many of a city's users landed there via their date departure pin rather than their registered city."
      >
        {cities.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No city data yet.
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
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 pr-4 text-right">% female</th>
                  <th className="py-2 pr-4 text-right">By departure</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => {
                  const known = c.male + c.female;
                  const femalePct = known > 0 ? (c.female / known) * 100 : null;
                  return (
                    <tr
                      key={c.cityKey}
                      className="border-b border-slate-800/40 text-slate-300"
                    >
                      <td className="py-2 pr-4">
                        {c.city}
                        {c.countryCode && (
                          <span className="ml-1 text-xs text-slate-500">
                            {c.countryCode}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right">{c.male}</td>
                      <td className="py-2 pr-4 text-right">{c.female}</td>
                      <td className="py-2 pr-4 text-right text-slate-500">
                        {c.unknown}
                      </td>
                      <td className="py-2 pr-4 text-right font-medium text-white">
                        {c.total}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {femalePct !== null ? `${femalePct.toFixed(0)}%` : "—"}
                      </td>
                      <td className="py-2 pr-4 text-right text-slate-400">
                        {c.fromDeparture}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </section>
  );
}
