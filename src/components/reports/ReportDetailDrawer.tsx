import { useState } from "react";
import type { ReportListItem } from "../../lib/api";
import { markReportReviewed } from "../../lib/api";
import { toTagList } from "../../lib/tags";

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
  1: "ring-1 ring-sky-500/30 bg-sky-500/10 text-sky-200 shadow-lg shadow-sky-950/20",
  2: "ring-1 ring-amber-500/30 bg-amber-500/10 text-amber-200 shadow-lg shadow-amber-950/20",
  3: "ring-1 ring-red-500/40 bg-red-500/15 text-red-200 shadow-lg shadow-red-950/40",
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
      <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-200">{value ?? "—"}</p>
    </div>
  );
}

function TagList({ items }: { items: string[] | string | undefined | null }) {
  const tags = toTagList(items);
  if (tags.length === 0) {
    return <span className="text-xs text-slate-500">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-xs font-medium text-slate-400">
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
    <section className="rounded-2xl bg-slate-950/60 p-5 shadow-xl ring-1 ring-white/5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            {title}
          </p>
          <h4 className="mt-1 text-base font-bold text-white">
            {displayName(user)}
          </h4>
        </div>
        <div className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-300 ring-1 ring-white/10 uppercase">
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
          <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Psychological Summary
          </p>
          {user.profile?.psychologicalSummary ? (
            <div className="rounded-xl bg-violet-500/10 p-4 ring-1 ring-violet-500/20">
              <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
                {user.profile.psychologicalSummary}
              </p>
            </div>
          ) : (
            <EmptyState text="No psychological summary recorded." />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Hobbies
            </p>
            <TagList items={user.profile?.hobbies} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Partner Preferences
            </p>
            <TagList items={user.profile?.partnerPreferences} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
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
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-slate-900/95 shadow-2xl shadow-black/80 backdrop-blur-2xl ring-1 ring-white/10 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-950/80 px-6 py-4 backdrop-blur-xl ring-1 ring-white/5">
          <h2 className="text-base font-bold tracking-tight text-white">Report Detail</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        {report && (
          <div className="space-y-6 px-6 py-6">
            <div
              className={`rounded-2xl p-4.5 ${TIER_COLORS[report.tier] ?? "ring-1 ring-white/10 bg-slate-900 text-slate-300"}`}
            >
              <p className="text-xs font-bold tracking-tight">
                {TIER_LABELS[report.tier] ?? `Tier ${report.tier}`}
              </p>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">
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
              <h4 className="mb-3 text-xs font-bold tracking-tight text-white uppercase">
                AI Triage Summary
              </h4>
              {report.reasonSummary ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/15 via-slate-950 to-slate-950 p-5 ring-1 ring-violet-500/30 shadow-xl">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-400 to-indigo-500" />
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-violet-300 uppercase">
                      LLM Classification
                    </span>
                  </div>
                  <blockquote className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
                    {report.reasonSummary}
                  </blockquote>
                </div>
              ) : (
                <EmptyState text="No AI reason summary was returned for this report." />
              )}
            </section>

            <section>
              <h4 className="mb-3 text-xs font-bold tracking-tight text-white uppercase">
                User's Report
              </h4>
              <div className="rounded-2xl bg-slate-950/60 p-5 ring-1 ring-white/5 shadow-xl">
                <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
                  {report.rawText}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl bg-slate-950/60 p-5 ring-1 ring-white/5">
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
              <div className="border-t border-white/5 pt-6">
                {markError && (
                  <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-300 ring-1 ring-red-500/20">
                    {markError}
                  </p>
                )}
                <button
                  onClick={handleMarkReviewed}
                  disabled={marking}
                  className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
