import type { PurchaseRow } from "../../lib/api";

/**
 * The purchase ledger table.
 *
 * Two columns carry the weight: WHO (the handle that actually reaches the
 * payer — `@username` on Telegram, the phone number on mobile, where a
 * synthetic negative Telegram id and no username is normal) and HOW MUCH,
 * where a Stars-derived dollar figure is always marked `≈` because Telegram
 * publishes no Stars→USD rate and the number is a documented estimate.
 */

const KIND_LABEL: Record<string, string> = {
  tickets: "Ticket store",
  date_ticket: "Date ticket",
  premium: "Premium",
  rematch: "Rematch",
  venue_change: "Venue change",
};

const KIND_STYLE: Record<string, string> = {
  tickets: "bg-sky-500/15 text-sky-300",
  date_ticket: "bg-rose-500/15 text-rose-300",
  premium: "bg-amber-500/15 text-amber-300",
  rematch: "bg-violet-500/15 text-violet-300",
  venue_change: "bg-emerald-500/15 text-emerald-300",
};

const STATUS_LABEL: Record<string, string> = {
  settled: "Settled",
  processing: "Processing",
  refunded: "Refunded",
  refund_failed: "Refund failed",
};

const STATUS_STYLE: Record<string, string> = {
  settled: "bg-emerald-500/15 text-emerald-300",
  processing: "bg-slate-500/20 text-slate-300",
  refunded: "bg-slate-500/20 text-slate-400 line-through decoration-slate-500",
  // Money we owe back and could not return — the one state that needs a human.
  refund_failed: "bg-rose-600/25 text-rose-200",
};

const PROVIDER_LABEL: Record<string, string> = {
  telegram_stars: "Telegram Stars",
  app_store: "App Store",
  mock: "mock (no real money)",
  unknown: "—",
};

function formatMoney(row: {
  amountStars: number | null;
  amountCents: number | null;
  currency: string | null;
  usdCents: number | null;
  amountIsEstimate: boolean;
}): { primary: string; secondary: string | null } {
  if (row.amountStars != null) {
    return {
      primary: `${row.amountStars} ⭐`,
      secondary: row.usdCents != null ? `≈ $${(row.usdCents / 100).toFixed(2)}` : null,
    };
  }
  if (row.amountCents != null) {
    const suffix = row.currency && row.currency !== "USD" ? ` ${row.currency}` : "";
    return { primary: `$${(row.amountCents / 100).toFixed(2)}${suffix}`, secondary: null };
  }
  return { primary: "—", secondary: null };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function payerName(row: PurchaseRow): string {
  const user = row.user;
  if (!user) return "deleted account";
  const parts = [user.firstName, user.surname].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `user ${row.userId.slice(0, 8)}`;
}

/** The handle that actually reaches this person, in preference order. */
function payerContact(row: PurchaseRow): string {
  const user = row.user;
  if (!user) return "—";
  if (user.telegramUsername) return `@${user.telegramUsername}`;
  if (user.phone) return user.phone;
  if (user.email) return user.email;
  return user.isMobileOnlyId ? "mobile account, no contact" : `tg:${user.telegramId}`;
}

interface Props {
  rows: PurchaseRow[];
  loading: boolean;
  onRowClick?: (userId: string) => void;
}

export default function PurchasesTable({ rows, loading, onRowClick }: Props) {
  return (
    <div className="glass-card-borderless overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#121316]">
            <tr className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="px-6 py-4">When</th>
              <th className="px-6 py-4">Who</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">What</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Rail</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                  No purchases yet.
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => {
                const money = formatMoney(row);
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.userId)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-semibold whitespace-nowrap text-white">
                      {payerName(row)}
                      {row.user?.age ? (
                        <span className="ml-1 font-normal text-slate-500">{row.user.age}</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {payerContact(row)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                          KIND_STYLE[row.kind] ?? "bg-slate-500/20 text-slate-300"
                        }`}
                      >
                        {KIND_LABEL[row.kind] ?? row.kind}
                      </span>
                      {row.detail && (
                        <div className="mt-1 text-[11px] text-slate-500">{row.detail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-white">{money.primary}</div>
                      {money.secondary && (
                        <div
                          className="text-[11px] text-slate-500"
                          title="Estimated from the documented $0.02/⭐ ticket rate — Telegram publishes no Stars→USD rate"
                        >
                          {money.secondary}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {PROVIDER_LABEL[row.provider] ?? row.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                          STATUS_STYLE[row.status] ?? "bg-slate-500/20 text-slate-300"
                        }`}
                        title={`source status: ${row.rawStatus}`}
                      >
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
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
