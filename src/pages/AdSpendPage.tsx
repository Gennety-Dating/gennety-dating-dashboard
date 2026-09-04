import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import AdSpendForm from "../components/adspend/AdSpendForm";
import AdSpendTable from "../components/adspend/AdSpendTable";
import CohortRetentionSection from "../components/adspend/CohortRetentionSection";
import {
  deleteAdSpend,
  getAdSpend,
  getAdSpendChannels,
  upsertAdSpend,
  type AdSpendRow,
  type AdSpendUpsertInput,
} from "../lib/api";
import ErrorBanner from "../components/ErrorBanner";

/**
 * The founder's own log of acquisition spend — what /admin/dashboard's
 * CAC / LTV:CAC / ROAS block is computed from (AD_SPEND_TRACKING_DESIGN.md
 * in the backend repo). Small volume, entered roughly weekly, so this is
 * unpaginated unlike Purchases.
 */

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdSpendPage() {
  const navigate = useNavigate();
  // Bumped by every mutation to re-run the fetch effect — the same
  // "loading is DERIVED, never set synchronously inside the effect" pattern
  // PurchasesPage uses for its query key, so there is no set-state-in-effect
  // violation: the effect below only ever calls setState inside a `.then`.
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState<{
    key: number;
    rows: AdSpendRow[];
    channels: string[];
    error: string;
  } | null>(null);
  const [editing, setEditing] = useState<AdSpendRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getAdSpend(), getAdSpendChannels()])
      .then(([spend, ch]) => {
        if (cancelled) return;
        setResult({ key: refreshKey, rows: spend.data, channels: ch.channels, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setResult({ key: refreshKey, rows: [], channels: [], error: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, navigate]);

  const loading = result === null || result.key !== refreshKey;
  const rows = result?.key === refreshKey ? result.rows : [];
  const channels = result?.key === refreshKey ? result.channels : [];
  const error = result?.key === refreshKey ? result.error : "";

  function load() {
    setRefreshKey((k) => k + 1);
  }

  function handleSubmit(input: AdSpendUpsertInput) {
    setSubmitting(true);
    setFormError("");
    upsertAdSpend(input)
      .then(() => {
        setEditing(null);
        load();
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setFormError(msg);
      })
      .finally(() => setSubmitting(false));
  }

  function handleDelete(row: AdSpendRow) {
    const label = `${row.channel} · ${row.category} · ${row.periodStart.slice(0, 10)}–${row.periodEnd.slice(0, 10)}`;
    if (!window.confirm(`Delete this entry?\n\n${label}`)) return;
    setDeleteError("");
    deleteAdSpend(row.id)
      .then(() => {
        if (editing?.id === row.id) setEditing(null);
        load();
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setDeleteError(msg);
      });
  }

  const totalSpendCents = rows.reduce((sum, r) => sum + r.amountUsdCents, 0);
  const attributableCents = rows
    .filter((r) => r.channel !== "unattributed")
    .reduce((sum, r) => sum + r.amountUsdCents, 0);
  const uniqueChannels = new Set(rows.map((r) => r.channel)).size;

  return (
    <div className="min-h-screen bg-canvas px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader />

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Ad Spend"
          description="Spend by channel and campaign. Feeds CAC, LTV:CAC and ROAS on the Analytics page."
        />

        {(error || deleteError) && (
          <ErrorBanner className="mb-4" message={error || deleteError} />
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total spend"
            value={usd(totalSpendCents)}
            sub="all categories"
            accent
            info="Everything logged, including content production and agency retainers — the founder's own P&L total, wider than what CAC is computed from."
          />
          <StatCard
            label="Attributable spend"
            value={usd(attributableCents)}
            sub="excludes unattributed"
            info="What actually feeds per-channel CAC — content_production/agency spend is logged as unattributed and counted only in the total above."
          />
          <StatCard label="Channels" value={uniqueChannels} sub="logged this history" />
          <StatCard label="Entries" value={rows.length} sub="spend rows" />
        </div>

        <AdSpendForm
          key={editing?.id ?? "new"}
          channels={channels}
          editing={editing}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditing(null)}
        />

        <AdSpendTable
          rows={rows}
          loading={loading}
          onEdit={(row) => {
            setEditing(row);
            setFormError("");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onDelete={handleDelete}
        />

        <CohortRetentionSection />
      </div>
    </div>
  );
}
