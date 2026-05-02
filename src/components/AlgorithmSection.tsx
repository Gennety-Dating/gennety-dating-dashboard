import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import type { AlgorithmData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";
import ChartCard from "./charts/ChartCard";

const TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#f1f5f9",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  data: AlgorithmData;
}

export default function AlgorithmSection({ data }: Props) {
  const synergyData = data.synergyCalibration.map((row) => ({
    bucket: row.bucket,
    decisions: row.decisions,
    acceptRate: row.acceptRate !== null ? +(row.acceptRate * 100).toFixed(1) : null,
  }));

  const pitchData = data.pitchLengthCalibration.map((row) => ({
    bucket: row.bucket,
    decisions: row.decisions,
    acceptRate: row.acceptRate !== null ? +(row.acceptRate * 100).toFixed(1) : null,
  }));

  const componentDelta = (
    [
      ["explicit", data.componentMeans.explicit],
      ["research", data.componentMeans.research],
      ["league", data.componentMeans.league],
      ["penalty", data.componentMeans.penalty],
    ] as const
  ).map(([name, m]) => ({
    name,
    accepted: m.accepted ?? 0,
    declined: m.declined ?? 0,
    delta: m.accepted !== null && m.declined !== null ? +(m.accepted - m.declined).toFixed(3) : 0,
  }));

  return (
    <section className="space-y-8">
      <SectionHeader
        title="Match algorithm"
        description="Diagnostics for the scoring formula MatchScore = (w₁·V_explicit + w₂·V_research) · V_league - w₃·V_penalty. Use these to tune weights and sanity-check the AI synergy score."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total matches"
          value={data.totalMatches.toLocaleString()}
          info="Every match row ever created, regardless of status."
        />
        <StatCard
          label="With score breakdown"
          value={data.totalScoreLogged.toLocaleString()}
          sub={
            data.totalMatches > 0
              ? `${((data.totalScoreLogged / data.totalMatches) * 100).toFixed(0)}% of matches`
              : undefined
          }
          info="Matches with a MatchScoreLog row. Older matches before the logging migration won't have one — coverage grows over time."
        />
        <StatCard
          label="Synergy 90-99 accept rate"
          value={
            synergyData[2]?.acceptRate !== null
              ? `${synergyData[2]?.acceptRate ?? "—"}%`
              : "—"
          }
          accent
          info="Per-side accept rate when the AI claimed a 90+ pair-level synergy. Should be meaningfully higher than the 70-79 bucket — if not, the synergy LLM isn't predictive."
          lowSample={(synergyData[2]?.decisions ?? 0) < 20}
        />
        <StatCard
          label="Embedding cosine (accept)"
          value={data.componentMeans.explicit.accepted?.toFixed(2) ?? "—"}
          sub={`vs ${data.componentMeans.explicit.declined?.toFixed(2) ?? "—"} on decline`}
          info="Average V_explicit (text embedding cosine similarity) for accepted vs declined matches. Higher delta = embeddings are predictive."
        />
      </div>

      {/* Synergy calibration */}
      <ChartCard
        title="Synergy score calibration"
        description="The AI synergy score (clamped to 70-99) on the X-axis vs the actual user accept rate per bucket. A flat line means the score has no predictive power and the LLM prompt needs work. Overlay shows how many decisions sit in each bucket."
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={synergyData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <XAxis dataKey="bucket" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              label={{ value: "Accept %", angle: -90, position: "insideLeft", fill: "#64748b" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#475569", fontSize: 11 }}
              label={{ value: "Decisions", angle: 90, position: "insideRight", fill: "#64748b" }}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Bar yAxisId="left" dataKey="acceptRate" name="Accept %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="right" dataKey="decisions" name="Decisions" fill="#334155" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Component means: accepted vs declined */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Score components: accepted vs declined"
          description="Average value of each scoring component on matches that were accepted vs declined. Big delta = component is doing its job. V_penalty inverted — higher value should appear on declined."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={componentDelta}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="accepted" name="Accepted" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="declined" name="Declined" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Pitch length × accept rate"
          description="X-axis: number of characters in the AI-generated pitch. Y-axis: per-side accept rate. Helps tune the pitch generator length — too long users skim, too short and the case isn't made."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pitchData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <XAxis dataKey="bucket" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="acceptRate" name="Accept %" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Component histograms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HistogramChart
          title="V_explicit distribution"
          description="Embedding cosine similarity across all logged matches. Bimodal shape ⇒ embeddings split candidates into 'similar' and 'different' clusters."
          bins={data.componentHistograms.explicit}
          color="#8b5cf6"
        />
        <HistogramChart
          title="V_research distribution"
          description="Sociological heuristic score (age, height, energy match)."
          bins={data.componentHistograms.research}
          color="#3b82f6"
        />
        <HistogramChart
          title="V_league distribution"
          description="Elo league multiplier. A spike near 1.0 means most matches are within the same league; a long tail toward 0 means many matches span big rating gaps."
          bins={data.componentHistograms.league}
          color="#10b981"
        />
        <HistogramChart
          title="V_penalty distribution"
          description="Negative-constraint penalty. Right-skewed = many users have accumulated rejection rules that filter out candidates."
          bins={data.componentHistograms.penalty}
          color="#ef4444"
        />
      </div>

      {/* Response heatmap */}
      <ChartCard
        title="Match response heatmap (UTC)"
        description="When users actually accept/decline, by day-of-week × hour. The Thursday 18:00 Kyiv (~15:00 UTC) cron should show a tall column right after dispatch — gaps mean users miss the moment, suggesting a different cadence."
      >
        <ResponseHeatmap data={data.responseHeatmap} />
      </ChartCard>

      {/* Rejection words */}
      <ChartCard
        title="Top words in rejection reasons"
        description="Crude word-frequency over free-text reasons. Stopwords filtered. A proper LLM categorizer is more accurate; for now, dominant words hint at what filters users want."
      >
        <ResponsiveContainer width="100%" height={Math.max(220, data.topRejectionWords.length * 20)}>
          <BarChart
            data={data.topRejectionWords.slice(0, 20)}
            layout="vertical"
            margin={{ left: 90, right: 16, top: 4, bottom: 4 }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="word"
              type="category"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              width={85}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}

function HistogramChart({
  title,
  description,
  bins,
  color,
}: {
  title: string;
  description: string;
  bins: Array<{ label: string; count: number }>;
  color: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={bins} margin={{ top: 4, right: 16, left: 0, bottom: 24 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#475569", fontSize: 9 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ResponseHeatmap({
  data,
}: {
  data: Array<Array<{ accept: number; decline: number }>>;
}) {
  // Convert to "decision intensity" per cell to colour-code at a glance.
  const totals = data.flat().map((c) => c.accept + c.decline);
  const max = Math.max(...totals, 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] text-slate-400">
        <thead>
          <tr>
            <th className="px-1 py-1 text-left">Day</th>
            {Array.from({ length: 24 }).map((_, h) => (
              <th key={h} className="px-1 py-1 text-center font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((label, dow) => (
            <tr key={label}>
              <td className="px-2 py-1 font-medium text-slate-300">{label}</td>
              {Array.from({ length: 24 }).map((_, h) => {
                const cell = data[dow]?.[h];
                const total = (cell?.accept ?? 0) + (cell?.decline ?? 0);
                const intensity = total / max;
                const acceptRate = total > 0 ? (cell?.accept ?? 0) / total : 0;
                return (
                  <td
                    key={h}
                    className="text-center"
                    style={{
                      backgroundColor: `rgba(139, 92, 246, ${intensity * 0.85})`,
                      color: intensity > 0.4 ? "#fff" : "#94a3b8",
                    }}
                    title={`${label} ${h}:00 — ${cell?.accept ?? 0} accept / ${cell?.decline ?? 0} decline (${(acceptRate * 100).toFixed(0)}% accept)`}
                  >
                    {total > 0 ? total : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
