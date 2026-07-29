import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { FunnelData } from "../lib/api";
import SectionHeader from "./SectionHeader";

const STEP_ORDER = ["language", "conversational", "completed"];
const STEP_LABELS: Record<string, string> = {
  language: "Language Selection",
  conversational: "Profile Interview",
  completed: "Completed",
};

const STEP_COLORS = ["#f59e0b", "#9f1239", "#e11d48"];

const STATUS_COLORS: Record<string, string> = {
  onboarding: "#f59e0b",
  active: "#e11d48",
  paused: "#64748b",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#17181c",
  border: "none",
  borderRadius: 12,
  color: "#ffffff",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
};

interface Props {
  data: FunnelData;
}

export default function FunnelSection({ data }: Props) {
  const funnelSteps = STEP_ORDER.map((key) => ({
    name: STEP_LABELS[key] ?? key,
    users: data.byOnboardingStep[key] ?? 0,
  }));

  const statusEntries = Object.entries(data.byStatus).map(
    ([name, value]) => ({ name, value }),
  );

  return (
    <section>
      <SectionHeader
        title="Onboarding Funnel"
        description="User progression through onboarding steps"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Funnel Steps */}
        <div className="glass-card-borderless rounded-3xl p-5.5">
          <h3 className="mb-3 text-sm font-extrabold text-white">
            Funnel Steps
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={funnelSteps}
              margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="users" radius={[6, 6, 0, 0]}>
                {funnelSteps.map((_, i) => (
                  <Cell key={i} fill={STEP_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="glass-card-borderless rounded-3xl p-5.5">
          <h3 className="mb-4 text-sm font-extrabold text-white">
            User Status Breakdown
          </h3>
          <div className="space-y-4">
            {statusEntries.map((s) => {
              const total = statusEntries.reduce(
                (acc, cur) => acc + cur.value,
                0,
              );
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              return (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-300">{s.name}</span>
                    <span className="font-medium text-white">
                      {s.value.toLocaleString()}{" "}
                      <span className="text-slate-500">
                        ({pct.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#121316] [box-shadow:inset_0_1px_1px_rgba(0,0,0,0.5)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          STATUS_COLORS[s.name] ?? "#9f1239",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
