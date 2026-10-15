import { useState } from "react";
import type { PulsePoint } from "../../lib/pulse-types";
import { num } from "../../lib/pulse-format";

interface Props {
  screen: string;
  points: PulsePoint[];
  dead: PulsePoint[];
  rage: PulsePoint[];
  total: number;
  truncated: boolean;
}

/**
 * Where people touch the screen, on a phone-shaped 9 : 19.5 canvas.
 *
 * Coordinates are normalized 0..1 from the top-left corner. Every dot is
 * semi-transparent, so density reads as brightness without a heatmap kernel.
 * `points` already contains the dead taps; dead and rage are drawn on top in
 * their own colours. A screenshot at `public/screens/<screen>.png`, when one
 * exists, becomes the background.
 */
export default function TapMap({ screen, points, dead, rage, total, truncated }: Props) {
  const [hasShot, setHasShot] = useState(true);
  const src = `/screens/${screen}.png`;
  const W = 90;
  const H = 195;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div
        className="relative w-[220px] shrink-0 overflow-hidden rounded-[26px] border border-white/15 bg-[#0d0e11]"
        style={{ aspectRatio: "9 / 19.5" }}
      >
        {hasShot && (
          <img
            src={src}
            alt=""
            onError={() => setHasShot(false)}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        )}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-label="Карта касаний"
        >
          {points.map(([x, y], i) => (
            <circle key={`p${i}`} cx={x * W} cy={y * H} r={1.6} fill="#cbd5e1" fillOpacity={0.22} />
          ))}
          {dead.map(([x, y], i) => (
            <circle key={`d${i}`} cx={x * W} cy={y * H} r={1.8} fill="#fbbf24" fillOpacity={0.55} />
          ))}
          {rage.map(([x, y], i) => (
            <circle key={`r${i}`} cx={x * W} cy={y * H} r={2.2} fill="#fb7185" fillOpacity={0.7} />
          ))}
        </svg>
        <div className="pointer-events-none absolute top-2 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/10" />
      </div>

      <div className="space-y-2 text-[11px] text-slate-400 tabular-nums">
        <Legend color="bg-slate-300/60" label="касания" n={points.length} />
        <Legend color="bg-amber-400" label="мимо элементов" n={dead.length} />
        <Legend color="bg-rose-400" label="ярость" n={rage.length} />
        <p className="pt-1 text-slate-500">
          Всего за 28 дней: {num(total)}
          {truncated && " · показаны последние 2000"}
        </p>
        {!hasShot && (
          <p className="max-w-[200px] text-slate-600">
            Фона нет. Снимок экрана положите в{" "}
            <code className="font-mono text-slate-500">public/screens/{screen}.png</code>
          </p>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span>{label}</span>
      <span className="text-slate-500">{num(n)}</span>
    </div>
  );
}
