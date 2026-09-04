import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MatchesData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";
import { TOOLTIP_STYLE } from "../lib/chartTheme";

const STATUS_COLORS: Record<string, string> = {
  Proposed: "#f59e0b",
  Negotiating: "#be123c",
  Scheduled: "#e11d48",
  Cancelled: "#ef4444",
  Completed: "#10b981",
};

interface Props {
  data: MatchesData;
}

export default function MatchesSection({ data }: Props) {
  const proposed =
    data.totalProposed -
    data.accepted -
    data.cancelled;

  const donutData = [
    { name: "Proposed", value: Math.max(proposed, 0) },
    {
      name: "Negotiating",
      value: Math.max(data.accepted - data.scheduled - data.completed, 0),
    },
    { name: "Scheduled", value: data.scheduled },
    { name: "Cancelled", value: data.cancelled },
    { name: "Completed", value: data.completed },
  ].filter((d) => d.value > 0);

  return (
    <section>
      <SectionHeader
        title="Match Efficiency"
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Proposed"
          value={data.totalProposed.toLocaleString()}
        />
        <StatCard
          label="Acceptance Rate"
          value={`${(data.acceptanceRate * 100).toFixed(1)}%`}
          accent
        />
        <StatCard
          label="Scheduled"
          value={data.scheduled.toLocaleString()}
        />
        <StatCard
          label="Completed"
          value={data.completed.toLocaleString()}
          sub="dates happened"
        />
        <StatCard
          label="Cancelled"
          value={data.cancelled.toLocaleString()}
        />
      </div>

      <div className="panel rounded-lg p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Match Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={3}
            >
              {donutData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name] ?? "#64748b"}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              formatter={(value: string) => (
                <span className="text-sm text-slate-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
