import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  /** Live character counter. Turns rose past `max` — the server refuses the save there. */
  count?: { length: number; max: number };
  /** What the field is FOR in the app — which surface shows it, or who reads it. */
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

/** One labelled composer field: label and counter above, hint or error below. */
export default function Field({ label, htmlFor, count, hint, error, children }: FieldProps) {
  const over = count ? count.length > count.max : false;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="block text-[10px] font-semibold tracking-wide text-slate-500 uppercase"
        >
          {label}
        </label>
        {count && (
          <span className={`text-[10px] font-medium tabular-nums ${over ? "text-rose-300" : "text-slate-500"}`}>
            {count.length.toLocaleString("en-US")}/{count.max.toLocaleString("en-US")}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11px] text-rose-300">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{hint}</p>
      )}
    </div>
  );
}
