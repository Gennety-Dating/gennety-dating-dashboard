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

const STATUS_COLORS: Record<string, string> = {
  Proposed: "#f59e0b",
  Negotiating: "#3b82f6",
  Scheduled: "#8b5cf6",
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
        description="Matchmaking lifecycle and acceptance metrics"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-3 text-sm font-medium text-slate-300">
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
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 8,
                color: "#f1f5f9",
              }}
            />
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
