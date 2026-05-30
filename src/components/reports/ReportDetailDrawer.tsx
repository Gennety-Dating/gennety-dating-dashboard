import { useState } from "react";
import type { ReportListItem } from "../../lib/api";
import { markReportReviewed } from "../../lib/api";

interface Props {
  report: ReportListItem | null;
  onClose: () => void;
  onReviewed: () => void;
}

const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — Disappointment",
  2: "Tier 2 — Ghosting / Ethical",
  3: "Tier 3 — Safety Threat",
};

const TIER_COLORS: Record<number, string> = {
  1: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  2: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  3: "border-red-500/30 bg-red-500/10 text-red-300",
};

function displayName(user: {
  firstName: string | null;
  surname: string | null;
  telegramId: string;
}): string {
  const parts = [user.firstName, user.surname].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `tg:${user.telegramId}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-slate-200">{value ?? "—"}</p>
    </div>
  );
}

function TagList({ items }: { items: string[] | undefined | null }) {
  if (!items || items.length === 0) {
    return <span className="text-sm text-slate-500">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-500">
      {text}
    </div>
  );
}

function UserSnapshot({
  title,
  user,
  showStrikes,
}: {
  title: string;
  user: ReportListItem["reporter"] | ReportListItem["reported"];
  showStrikes?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
            {title}
          </p>
          <h4 className="mt-1 text-base font-semibold text-white">
            {displayName(user)}
          </h4>
        </div>
        <div className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-medium tracking-wide text-slate-300 uppercase">
          <span className="capitalize">{user.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Telegram" value={`tg:${user.telegramId}`} />
        <Field label="Email" value={user.email ?? "—"} />
        <Field
          label="Email Verified"
          value={user.isEmailVerified ? "Yes" : "No"}
        />
        <Field
          label="Verification"
          value={<span className="capitalize">{user.verificationStatus}</span>}
        />
        <Field label="Photos" value={user.profile?.photos.length ?? 0} />
        {showStrikes ? <Field label="Strikes" value={user.strikes} /> : null}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-1.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
            Psychological Summary
          </p>
          {user.profile?.psychologicalSummary ? (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                {user.profile.psychologicalSummary}
              </p>
            </div>
          ) : (
            <EmptyState text="No psychological summary recorded." />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
              Hobbies
            </p>
            <TagList items={user.profile?.hobbies} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
              Partner Preferences
            </p>
            <TagList items={user.profile?.partnerPreferences} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
              Negative Constraints
            </p>
            <TagList items={user.profile?.negativeConstraints} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Height"
              value={
                user.profile?.height ? `${user.profile.height} cm` : "—"
              }
            />
            <Field
              label="Age Range"
              value={
                user.profile?.ageRangeMin && user.profile?.ageRangeMax
                  ? `${user.profile.ageRangeMin}–${user.profile.ageRangeMax}`
                  : "—"
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ReportDetailDrawer({
  report,
  onClose,
  onReviewed,
}: Props) {
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");

  const open = report !== null;

  async function handleMarkReviewed() {
    if (!report) return;
    setMarking(true);
    setMarkError("");
    try {
      await markReportReviewed(report.id);
      onReviewed();
    } catch (err) {
      setMarkError(err instanceof Error ? err.message : "Failed to mark reviewed");
    } finally {
      setMarking(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4 backdrop-blur">
          <h2 className="text-base font-semibold text-white">Report Detail</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg border border-slate-700 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        {report && (
          <div className="space-y-6 px-6 py-6">
            <div
              className={`rounded-xl border p-4 ${TIER_COLORS[report.tier] ?? "border-slate-700 bg-slate-800 text-slate-300"}`}
            >
              <p className="text-sm font-semibold">
                {TIER_LABELS[report.tier] ?? `Tier ${report.tier}`}
              </p>
              <p className="mt-1 text-xs opacity-80">
                {report.tier === 1 &&
                  "Adjusts future match preferences for the reporter."}
                {report.tier === 2 &&
                  "Strike added to reported user. 2 strikes = 14-day suspension."}
                {report.tier === 3 &&
                  "Immediate account freeze. Requires manual review."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <UserSnapshot title="Reporter" user={report.reporter} />
              <UserSnapshot
                title="Reported User"
                user={report.reported}
                showStrikes
              />
            </div>

            <section>
              <h4 className="mb-3 text-sm font-semibold text-white">
                AI Triage Summary
              </h4>
              {report.reasonSummary ? (
                <div className="relative overflow-hidden rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-slate-900 to-slate-900 p-5">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-400 to-fuchsia-500" />
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-violet-300 uppercase">
                      LLM Classification
                    </span>
                  </div>
                  <blockquote className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                    {report.reasonSummary}
                  </blockquote>
                </div>
              ) : (
                <EmptyState text="No AI reason summary was returned for this report." />
              )}
            </section>

            <section>
              <h4 className="mb-3 text-sm font-semibold text-white">
                User's Report
              </h4>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                  {report.rawText}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Report ID"
                value={
                  <span className="font-mono text-xs break-all">{report.id}</span>
                }
              />
              <Field
                label="Match ID"
                value={
                  <span className="font-mono text-xs break-all">
                    {report.match.id}
                  </span>
                }
              />
              <Field
                label="Match Status"
                value={
                  <span className="capitalize">{report.match.status}</span>
                }
              />
              <Field
                label="Reported At"
                value={new Date(report.createdAt).toLocaleString()}
              />
              <Field
                label="Review Status"
                value={report.adminReviewed ? "Reviewed" : "Pending"}
              />
            </div>

            {!report.adminReviewed && (
              <div className="border-t border-slate-800 pt-6">
                {markError && (
                  <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {markError}
                  </p>
                )}
                <button
                  onClick={handleMarkReviewed}
                  disabled={marking}
                  className="w-full cursor-pointer rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {marking ? "Marking..." : "Mark as Reviewed"}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
