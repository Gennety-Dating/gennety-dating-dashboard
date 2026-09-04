import { useId } from "react";

interface InfoHintProps {
  /** What the metric measures and how it is computed. */
  text: string;
  /** Anchor the popover to the marker's right edge (default) or its left. */
  align?: "left" | "right";
}

/**
 * The single explainer affordance on the dashboard.
 *
 * Methodology notes are worth keeping and not worth showing: a reader who
 * already knows what "net conversion" excludes should see the number, not the
 * paragraph. So the text lives one hover — or one Tab — away instead of
 * standing permanently beside the value it describes.
 *
 * `aria-describedby` rather than `role="tooltip"`, so the text is announced
 * when the marker takes focus instead of being read out with every card.
 */
export default function InfoHint({ text, align = "right" }: InfoHintProps) {
  const id = useId();

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-label="What this measures"
        aria-describedby={id}
        className="peer flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/15 text-[9px] leading-none font-semibold text-slate-500 transition-colors hover:border-white/35 hover:text-slate-200 focus-visible:border-white/35 focus-visible:text-slate-200 focus-visible:outline-none"
      >
        i
      </button>
      <span
        id={id}
        className={`pointer-events-none absolute top-6 z-30 w-64 rounded-md border border-white/10 bg-[#24262c] p-3 text-[11px] leading-relaxed font-normal text-slate-300 opacity-0 transition-opacity peer-hover:opacity-100 peer-focus-visible:opacity-100 ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
