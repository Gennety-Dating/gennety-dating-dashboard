import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DemographicsData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";

const GENDER_COLORS: Record<string, string> = {
  male: "#6366f1",
  female: "#ec4899",
  unknown: "#64748b",
};

const FALLBACK_COLOR = "#94a3b8";

interface Props {
  data: DemographicsData;
}

export default function DemographicsSection({ data }: Props) {
  const genderEntries = Object.entries(data.genderSplit).map(
    ([name, value]) => ({ name, value }),
  );

  const universityEntries = data.byUniversity.slice(0, 8).map((u) => ({
    name: u.domain ?? "Unknown",
    count: u.count,
  }));

  return (
    <section>
      <SectionHeader
        title="Demographics"
        description="User base composition by gender and university"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={data.totalUsers.toLocaleString()} accent />
        {genderEntries.map((g) => (
          <StatCard
            key={g.name}
            label={g.name.charAt(0).toUpperCase() + g.name.slice(1)}
            value={g.value.toLocaleString()}
            sub={`${((g.value / data.totalUsers) * 100).toFixed(1)}%`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gender Pie */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-3 text-sm font-medium text-slate-300">
            Gender Split
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={genderEntries}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                label={(props) =>
                  `${props.name ?? ""} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`
                }
              >
                {genderEntries.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={GENDER_COLORS[entry.name] ?? FALLBACK_COLOR}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#f1f5f9",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* University Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-3 text-sm font-medium text-slate-300">
            Top Universities
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={universityEntries}
              layout="vertical"
              margin={{ left: 80, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#f1f5f9",
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
