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
      className={`rounded-2xl bg-slate-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-200 hover:ring-white/10 ${className ?? ""}`}
    >
      <h3 className="text-sm font-semibold tracking-tight text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1 mb-4 text-xs text-slate-400/80 leading-relaxed">{description}</p>
      )}
      {children}
    </div>
  );
}
