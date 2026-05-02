import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper that gives a chart panel a consistent header + description so
 * the user always knows what the metric means without having to scroll
 * back to the section intro.
 */
export default function ChartCard({ title, description, children, className }: Props) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${className ?? ""}`}
    >
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      {description && (
        <p className="mt-1 mb-3 text-xs text-slate-500">{description}</p>
      )}
      {children}
    </div>
  );
}
