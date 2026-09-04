import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ReportsStatsData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";
import { TOOLTIP_STYLE } from "../lib/chartTheme";

const TIER_COLORS = ["#e11d48", "#f59e0b", "#ef4444"]; // rose, amber, red
const TIER_LABELS = ["T1 · Disappointment", "T2 · Ghosting", "T3 · Safety"];

interface Props {
  data: ReportsStatsData;
}

export default function ReportsSection({ data }: Props) {
  const chartData = [1, 2, 3].map((tier, i) => ({
    name: TIER_LABELS[i],
    count: data.byTier[tier] ?? 0,
  }));

  return (
    <section>
      <SectionHeader
        title="Moderation Reports"
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Reports" value={data.total.toLocaleString()} />
        <StatCard
          label="Tier 1"
          value={(data.byTier[1] ?? 0).toLocaleString()}
          sub="disappointment"
        />
        <StatCard
          label="Tier 2"
          value={(data.byTier[2] ?? 0).toLocaleString()}
          sub="strikes issued"
        />
        <StatCard
          label="Tier 3 Pending"
          value={data.unreviewedTier3.toLocaleString()}
          accent
          sub="needs review"
        />
      </div>

      <div className="panel rounded-lg p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Reports by Tier
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={TIER_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
