import { useState } from "react";
import {
  AD_SPEND_ATTRIBUTION_WINDOW_DAYS,
  AD_SPEND_CATEGORIES,
  AD_SPEND_UNATTRIBUTED_CHANNEL,
  categoryRequiresUnattributed,
  type AdSpendCategory,
  type AdSpendRow,
  type AdSpendUpsertInput,
} from "../../lib/api";

/**
 * Log one spend entry. A category drives two things a channel category
 * alone can't: whether the channel field even makes sense (content/agency
 * spend buys no trackable acquisition — the channel is forced to
 * "unattributed", and the server rejects anything else for those two), and
 * how many days past the period a conversion still counts (shown as a hint,
 * never silently applied anywhere the founder can't see it).
 */

const CATEGORY_LABEL: Record<AdSpendCategory, string> = {
  performance_ads: "Performance ads",
  influencer: "Influencer",
  offline_event: "Offline event",
  content_production: "Content production",
  agency: "Agency",
  other: "Other",
};

const NOTE_REQUIRED: AdSpendCategory[] = ["offline_event", "influencer"];

/** Suggested USD conversion only — the founder can always override; never recomputed silently once entered. */
const APPROX_USD_RATE: Record<string, number> = {
  USD: 1,
  UAH: 0.024,
  EUR: 1.08,
  GBP: 1.26,
  PLN: 0.25,
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday–Sunday of the current week, used to pre-fill a performance-ads period — the one category whose window is short enough that "this week" is the obvious default. */
function currentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: isoDate(monday), end: isoDate(sunday) };
}

interface FormState {
  channel: string;
  category: AdSpendCategory;
  periodStart: string;
  periodEnd: string;
  amount: string;
  currency: string;
  amountUsd: string;
  note: string;
}

const EMPTY_FORM: FormState = {
  channel: "",
  category: "performance_ads",
  periodStart: "",
  periodEnd: "",
  amount: "",
  currency: "USD",
  amountUsd: "",
  note: "",
};

function fromRow(row: AdSpendRow): FormState {
  return {
    channel: row.channel,
    category: row.category,
    periodStart: row.periodStart.slice(0, 10),
    periodEnd: row.periodEnd.slice(0, 10),
    amount: String(row.amount),
    currency: row.currency,
    amountUsd: (row.amountUsdCents / 100).toFixed(2),
    note: row.note ?? "",
  };
}

interface Props {
  channels: string[];
  editing: AdSpendRow | null;
  submitting: boolean;
  error: string;
  onSubmit: (input: AdSpendUpsertInput) => void;
  onCancelEdit: () => void;
}

export default function AdSpendForm({
  channels,
  editing,
  submitting,
  error,
  onSubmit,
  onCancelEdit,
}: Props) {
  // The caller remounts this component with `key={editing?.id ?? "new"}"`
  // whenever which row is being edited changes, so the initial state below
  // is computed once per mount rather than synced via an effect — the same
  // "reset state via key" idiom PurchasesPage's own filters avoid a
  // set-state-in-effect for.
  const [form, setForm] = useState<FormState>(() => (editing ? fromRow(editing) : EMPTY_FORM));
  // Don't let the USD-suggestion auto-fill clobber a stored figure on edit.
  const [touchedUsd, setTouchedUsd] = useState(() => editing != null);
  const [validationError, setValidationError] = useState("");

  const requiresUnattributed = categoryRequiresUnattributed(form.category);
  const windowDays = AD_SPEND_ATTRIBUTION_WINDOW_DAYS[form.category];
  const noteRequired = NOTE_REQUIRED.includes(form.category);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "category") {
        const cat = value as AdSpendCategory;
        if (categoryRequiresUnattributed(cat)) {
          next.channel = AD_SPEND_UNATTRIBUTED_CHANNEL;
        } else if (prev.channel === AD_SPEND_UNATTRIBUTED_CHANNEL) {
          next.channel = "";
        }
        if (cat === "performance_ads" && !prev.periodStart && !prev.periodEnd) {
          const week = currentWeekRange();
          next.periodStart = week.start;
          next.periodEnd = week.end;
        }
      }

      // Auto-suggest the USD equivalent until the founder types their own.
      if ((key === "amount" || key === "currency") && !touchedUsd) {
        const amountNum = parseFloat(key === "amount" ? (value as string) : next.amount);
        const rate = APPROX_USD_RATE[(key === "currency" ? (value as string) : next.currency).toUpperCase()];
        if (Number.isFinite(amountNum) && rate) {
          next.amountUsd = (amountNum * rate).toFixed(2);
        }
      }

      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const amount = parseFloat(form.amount);
    const amountUsd = parseFloat(form.amountUsd);
    const currency = form.currency.trim().toUpperCase();
    const channel = form.channel.trim();

    if (!channel) {
      setValidationError("Channel is required.");
      return;
    }
    if (!form.periodStart || !form.periodEnd) {
      setValidationError("Period start and end are required.");
      return;
    }
    if (form.periodEnd < form.periodStart) {
      setValidationError("Period end can't be before period start.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError("Amount must be a positive number.");
      return;
    }
    if (!currency || currency.length !== 3) {
      setValidationError("Currency must be a 3-letter ISO code, e.g. USD.");
      return;
    }
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      setValidationError("USD equivalent must be a positive number.");
      return;
    }
    if (requiresUnattributed && channel !== AD_SPEND_UNATTRIBUTED_CHANNEL) {
      setValidationError("Content production / agency spend must be logged as unattributed.");
      return;
    }
    if (noteRequired && !form.note.trim()) {
      setValidationError(`A note is required for ${CATEGORY_LABEL[form.category]} — say what it bought.`);
      return;
    }

    onSubmit({
      channel,
      category: form.category,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      amount,
      currency,
      amountUsdCents: Math.round(amountUsd * 100),
      note: form.note.trim() || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card-borderless mb-5 rounded-3xl p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">
          {editing ? "Edit entry" : "Log spend"}
        </h3>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inner-glow cursor-pointer rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white"
          >
            Cancel edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Channel
          </label>
          <input
            list="ad-spend-channels"
            value={form.channel}
            disabled={requiresUnattributed}
            onChange={(e) => update("channel", e.target.value)}
            placeholder={requiresUnattributed ? AD_SPEND_UNATTRIBUTED_CHANNEL : "tg:campaign_name"}
            className="w-full rounded-xl bg-[#17181c] px-3 py-2 text-xs font-medium text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)] disabled:opacity-50"
          />
          <datalist id="ad-spend-channels">
            {channels.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="lg:col-span-2">
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value as AdSpendCategory)}
            className="w-full cursor-pointer rounded-xl bg-[#17181c] px-3 py-2 text-xs font-medium text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
          >
            {AD_SPEND_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-slate-500">
            {windowDays == null
              ? "Excluded from per-channel CAC — counted only in the P&L total."
              : `Conversions count up to ${windowDays} day${windowDays === 1 ? "" : "s"} after the period ends.`}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Period start
          </label>
          <input
            type="date"
            value={form.periodStart}
            onChange={(e) => update("periodStart", e.target.value)}
            className="w-full rounded-xl bg-[#17181c] px-3 py-2 text-xs font-medium text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Period end
          </label>
          <input
            type="date"
            value={form.periodEnd}
            onChange={(e) => update("periodEnd", e.target.value)}
            className="w-full rounded-xl bg-[#17181c] px-3 py-2 text-xs font-medium text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Amount
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            className="w-full rounded-xl bg-[#17181c] px-3 py-2 text-xs font-medium text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Currency
          </label>
          <input
            value={form.currency}
            onChange={(e) => update("currency", e.target.value.toUpperCase())}
            maxLength={3}
            className="w-full rounded-xl bg-[#17181c] px-3 py-2 text-xs font-medium text-white uppercase [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            USD equivalent
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amountUsd}
            onChange={(e) => {
              setTouchedUsd(true);
              update("amountUsd", e.target.value);
            }}
            className="w-full rounded-xl bg-[#17181c] px-3 py-2 text-xs font-medium text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
          />
          {form.currency !== "USD" && (
            <p className="mt-1 text-[10px] text-slate-500">Suggested from an approximate rate — always editable.</p>
          )}
        </div>

        <div className="col-span-2 lg:col-span-4">
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Note {noteRequired && <span className="text-rose-400">(required)</span>}
          </label>
          <input
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            placeholder="What this bought — a campaign name, an event, a deliverable"
            className="w-full rounded-xl bg-[#17181c] px-3 py-2 text-xs font-medium text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
          />
        </div>
      </div>

      {(validationError || error) && (
        <div className="mt-3 rounded-2xl bg-rose-950/40 p-3 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3),inset_0_0_10px_rgba(244,63,94,0.1)]">
          {validationError || error}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inner-glow-cherry cursor-pointer rounded-2xl px-5 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : editing ? "Save changes" : "Log spend"}
        </button>
      </div>
    </form>
  );
}
