interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
        {label}
      </p>
      <p
        className={`mt-1 text-3xl font-bold ${accent ? "text-violet-400" : "text-white"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}
