/**
 * Shared Recharts styling.
 *
 * This object was pasted verbatim into eleven section files, which meant the
 * chart tooltips could — and did — drift apart from one another. One copy now,
 * flattened to match the panels around it: a hairline border instead of a
 * drop shadow, and no rounding beyond the rest of the surface scale.
 */
export const TOOLTIP_STYLE = {
  backgroundColor: "#24262c",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 6,
  color: "#f8fafc",
  fontSize: 12,
} as const;

/** Axis labels: one step quieter than the plotted data, everywhere. */
export const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 } as const;
