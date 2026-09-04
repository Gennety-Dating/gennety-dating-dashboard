import type { AdSpendRow } from "../../lib/api";

/**
 * The ad-spend ledger table. Small and founder-entered, so every row is
 * editable and deletable inline — this is a working log, not an audit trail.
 */

const CATEGORY_LABEL: Record<string, string> = {
  performance_ads: "Performance ads",
  influencer: "Influencer",
  offline_event: "Offline event",
  content_production: "Content production",
  agency: "Agency",
  other: "Other",
};

const CATEGORY_STYLE: Record<string, string> = {
  performance_ads: "bg-sky-500/15 text-sky-300",
  influencer: "bg-violet-500/15 text-violet-300",
  offline_event: "bg-amber-500/15 text-amber-300",
  content_production: "bg-slate-500/20 text-slate-300",
  agency: "bg-slate-500/20 text-slate-300",
  other: "bg-slate-500/20 text-slate-300",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(row: AdSpendRow): { primary: string; secondary: string | null } {
  const primary = `${row.amount.toLocaleString()} ${row.currency}`;
  if (row.currency === "USD") return { primary, secondary: null };
  return { primary, secondary: `≈ $${(row.amountUsdCents / 100).toFixed(2)}` };
}

interface Props {
  rows: AdSpendRow[];
  loading: boolean;
  onEdit: (row: AdSpendRow) => void;
  onDelete: (row: AdSpendRow) => void;
}

export default function AdSpendTable({ rows, loading, onEdit, onDelete }: Props) {
  return (
    <div className="panel overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-canvas">
            <tr className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              <th className="px-6 py-4">Channel</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Spend</th>
              <th className="px-6 py-4">Note</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                  No spend logged yet.
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => {
                const money = formatMoney(row);
                return (
                  <tr key={row.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-semibold whitespace-nowrap text-white">
                      {row.channel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                          CATEGORY_STYLE[row.category] ?? "bg-slate-500/20 text-slate-300"
                        }`}
                      >
                        {CATEGORY_LABEL[row.category] ?? row.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{money.primary}</div>
                      {money.secondary && (
                        <div className="text-[11px] text-slate-500">{money.secondary}</div>
                      )}
                    </td>
                    <td className="max-w-[16rem] px-6 py-4 text-slate-400">
                      {row.note ?? "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(row)}
                          className="btn cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(row)}
                          className="btn cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold text-rose-300/80 hover:text-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
