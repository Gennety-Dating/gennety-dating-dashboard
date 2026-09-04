import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { AudienceData, HeatmapData } from "../lib/api";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";
import ChartCard from "./charts/ChartCard";
import { TOOLTIP_STYLE } from "../lib/chartTheme";

const CHART_COLORS = [
  "#e11d48", "#be123c", "#f43f5e", "#10b981", "#f59e0b",
  "#9f1239", "#fb7185", "#38bdf8", "#f97316",
];

interface Props {
  audience: AudienceData;
  heatmap: HeatmapData | null;
}

export default function AudienceSection({ audience, heatmap }: Props) {
  const ageData = audience.age.map((a) => ({ name: a.bucket, value: a.count }));
  const majorData = audience.majorClusters.map((m) => ({ name: m.cluster, value: m.count }));
  const radius = audience.matchRadius;
  const radiusTotal = radius.campus_only + radius.citywide + radius.unknown;
  const radiusData = [
    { name: "Campus only", value: radius.campus_only },
    { name: "Citywide", value: radius.citywide },
    { name: "Unknown", value: radius.unknown },
  ].filter((r) => r.value > 0);

  return (
    <section className="space-y-8">
      <SectionHeader
        title="Audience"
        description="Demographics, interests, psychology and geography of the registered base."
      />

      {/* Top-level summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total users"
          value={audience.totalUsers.toLocaleString()}
          accent
          info="All accounts in the database, including onboarding, paused, suspended, and banned. The funnel charts narrow this down."
        />
        <StatCard
          label="Geo coverage"
          value={`${(audience.geo.knownPct * 100).toFixed(1)}%`}
          sub={`${audience.geo.known.toLocaleString()} with coordinates`}
          info="Share of users with known lat/lng. Without coordinates the matcher falls back to campus_only and can't compute Meet-Halfway midpoints."
        />
        <StatCard
          label="Campus-only preference"
          value={
            radiusTotal > 0
              ? `${((radius.campus_only / radiusTotal) * 100).toFixed(1)}%`
              : "—"
          }
          info="Users who restricted matches to their own university campus. Lower this share → more cross-campus matches possible."
        />
        <StatCard
          label="Top hobby"
          value={audience.topHobbies[0]?.name ?? "—"}
          sub={
            audience.topHobbies[0]
              ? `${audience.topHobbies[0].count.toLocaleString()} users`
              : undefined
          }
          info="Most-listed hobby across all profiles. Useful for content/marketing copy that resonates with the dominant interest."
        />
      </div>

      {/* Age + Major */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Age distribution"
          description="User counts in age brackets."
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ageData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#e11d48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Major clusters"
          description="Each major is mapped to one of: STEM, Humanities, Arts, Business, Health, Other. A heuristic keyword classifier — exact totals may shift slightly as the keyword list improves."
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={majorData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#be123c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Hobbies */}
      <ChartCard
        title="Top 20 hobbies"
        description="Counts how many users list each hobby on their profile (case-insensitive, deduplicated by lowercased text)."
      >
        <ResponsiveContainer width="100%" height={420}>
          <BarChart
            data={audience.topHobbies.slice(0, 20)}
            layout="vertical"
            margin={{ left: 90, right: 16, top: 4, bottom: 4 }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              width={85}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="#ec4899" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Psych grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <PsychPie
          title="Social energy"
          description="Introvert / Extrovert / Ambivert detected by keyword scan in the LLM-generated psychological summary. Coarse but free."
          data={audience.socialEnergy}
        />
        <PsychPie
          title="Attachment style"
          description="Secure / Anxious / Avoidant / Disorganized — keyword-detected from the psychological summary. Use as a directional signal, not a clinical assessment."
          data={audience.attachmentStyle}
        />
        <PsychPie
          title="Humor style"
          description="Dry / Playful / Sarcastic / Wholesome / Dark — keyword-detected. Useful when crafting bot copy and onboarding tone."
          data={audience.humorStyle}
        />
        <PsychPie
          title="Communication style"
          description="Direct / Diplomatic / Expressive / Reserved — keyword-detected. Pairing two `direct` users vs `direct + reserved` may need different pitch templates."
          data={audience.communicationStyle}
        />
      </div>

      {/* Match radius */}
      <ChartCard
        title="Match radius preference"
        description="`campus_only` keeps matches inside one university; `citywide` opens up to cross-campus pairs."
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={radiusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {radiusData.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Heatmap (geo) */}
      {heatmap && (
        <ChartCard
          title="User density (k-anonymous heatmap)"
          description="Aggregated to ~1km cells, only users who opted into research (`researchOptIn = true`), and only cells with ≥3 users (so individuals can't be re-identified). Bigger circle = more users in that cell."
        >
          {heatmap.cellCount === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Not enough opt-in users with location data to render a privacy-safe map yet.
            </p>
          ) : (
            <SimpleHeatmap cells={heatmap.cells} />
          )}
        </ChartCard>
      )}
    </section>
  );
}

function PsychPie({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: Array<{ value: string; count: number }>;
}) {
  const visible = data.filter((d) => d.count > 0);
  return (
    <ChartCard title={title} description={description}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={visible}
            dataKey="count"
            nameKey="value"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={75}
            paddingAngle={2}
          >
            {visible.map((entry, i) => (
              <Cell key={entry.value} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visible.map((d, i) => (
          <span
            key={d.value}
            className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {d.value} · {d.count}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

/**
 * Minimal canvas-free heatmap. Plots aggregated cells in a relative
 * coordinate space — cell size scales with count. Good enough for a
 * "do users cluster here?" overview without pulling in leaflet/d3.
 */
function SimpleHeatmap({
  cells,
}: {
  cells: Array<{ lat: number; lng: number; count: number }>;
}) {
  if (cells.length === 0) return null;
  const lats = cells.map((c) => c.lat);
  const lngs = cells.map((c) => c.lng);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lngMin = Math.min(...lngs);
  const lngMax = Math.max(...lngs);
  const maxCount = Math.max(...cells.map((c) => c.count));
  const latRange = latMax - latMin || 1;
  const lngRange = lngMax - lngMin || 1;

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-lg bg-canvas">
      {cells.map((c, i) => {
        // Y is inverted: higher latitude = top of the canvas.
        const left = ((c.lng - lngMin) / lngRange) * 100;
        const top = ((latMax - c.lat) / latRange) * 100;
        const size = 6 + (c.count / maxCount) * 36;
        const opacity = 0.35 + (c.count / maxCount) * 0.55;
        return (
          <div
            key={i}
            title={`${c.count} users near ${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}`}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-help rounded-full bg-rose-500 transition hover:bg-rose-400"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              opacity,
            }}
          />
        );
      })}
      <div className="absolute right-3 bottom-2 text-[10px] tracking-wide text-slate-500 uppercase">
        Aggregated, k≥3 per cell
      </div>
    </div>
  );
}
