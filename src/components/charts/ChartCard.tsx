import type { ReactNode } from "react";
import InfoHint from "../InfoHint";

interface Props {
  title: string;
  /**
   * What the chart measures and how. Surfaced through the ⓘ marker rather
   * than printed above the plot: thirty-eight of these standing open at once
   * is a wall of prose competing with the data it describes.
   */
  description?: string;
  /**
   * The exception to the rule above — a key the chart cannot be read without
   * (what a dash means, what a shaded band covers). Stays visible.
   */
  legend?: string;
  children: ReactNode;
  className?: string;
}

export default function ChartCard({
  title,
  description,
  legend,
  children,
  className,
}: Props) {
  return (
    <div className={`panel rounded-lg p-4 ${className ?? ""}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
          {title}
        </h3>
        {description && <InfoHint text={description} />}
      </div>
      {legend && (
        <p className="mb-3 -mt-1 text-[11px] leading-relaxed text-slate-500">
          {legend}
        </p>
      )}
      {children}
    </div>
  );
}
