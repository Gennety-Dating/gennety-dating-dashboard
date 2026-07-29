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
      className={`glass-card-borderless rounded-3xl p-5.5 transition-all duration-200 ${className ?? ""}`}
    >
      <h3 className="text-sm font-extrabold tracking-tight text-white">{title}</h3>
      {description && (
        <p className="mt-1 mb-4 text-xs font-medium text-rose-200/60 leading-relaxed">{description}</p>
      )}
      {children}
    </div>
  );
}
