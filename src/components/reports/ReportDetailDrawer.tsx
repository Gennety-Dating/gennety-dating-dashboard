import { useState } from "react";
import type { ReportListItem } from "../../lib/api";
import { markReportReviewed } from "../../lib/api";
import { toTagList } from "../../lib/tags";
import ErrorBanner from "../ErrorBanner";

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
  1: "bg-slate-200/15 text-slate-200",
  2: "bg-slate-200/20 text-slate-100",
  3: "bg-white/20 text-white",
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
      <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-200">{value ?? "—"}</p>
    </div>
  );
}

function TagList({ items }: { items: string[] | string | undefined | null }) {
  const tags = toTagList(items);
  if (tags.length === 0) {
    return <span className="text-xs font-medium text-slate-500">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-md bg-canvas px-3 py-1 text-xs font-semibold text-slate-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md bg-canvas p-4 text-xs font-medium text-slate-400">
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
    <section className="rounded-lg bg-canvas p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
            {title}
          </p>
          <h4 className="mt-1 text-base font-semibold text-white">
            {displayName(user)}
          </h4>
        </div>
        <div className="rounded-full bg-panel px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-300 uppercase">
          <span className="capitalize">{user.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
          <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
            Psychological Summary
          </p>
          {user.profile?.psychologicalSummary ? (
            <div className="rounded-md bg-rose-950/30 p-4">
              <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200">
                {user.profile.psychologicalSummary}
              </p>
            </div>
          ) : (
            <EmptyState text="No psychological summary recorded." />
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              Hobbies
            </p>
            <TagList items={user.profile?.hobbies} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              Partner Preferences
            </p>
            <TagList items={user.profile?.partnerPreferences} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              Negative Constraints
            </p>
            <TagList items={user.profile?.negativeConstraints} />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
        className={`fixed inset-0 z-40 bg-canvas/80 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-canvas/95 transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-panel/95 px-6 py-3">
          <h2 className="text-base font-semibold tracking-tight text-white">Report Detail</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn cursor-pointer rounded-md px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>

        {report && (
          <div className="space-y-6 px-6 py-6">
            <div
              className={`rounded-lg p-5 ${TIER_COLORS[report.tier] ?? "bg-canvas text-slate-300"}`}
            >
              <p className="text-xs font-semibold tracking-tight">
                {TIER_LABELS[report.tier] ?? `Tier ${report.tier}`}
              </p>
              <p className="mt-1 text-xs opacity-90 leading-relaxed font-medium">
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
              <h4 className="mb-3 text-xs font-semibold tracking-tight text-white uppercase">
                AI Triage Summary
              </h4>
              {report.reasonSummary ? (
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-rose-950/40 via-[#121316] to-[#121316] p-4">
                              <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
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
              <h4 className="mb-3 text-xs font-semibold tracking-tight text-white uppercase">
                User's Report
              </h4>
              <div className="rounded-lg bg-canvas p-4">
                <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap text-slate-200">
                  {report.rawText}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-lg bg-canvas p-4">
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
              <div className="pt-4">
                {markError && (
                  <ErrorBanner className="mb-3" message={markError} />
                )}
                <button
                  onClick={handleMarkReviewed}
                  disabled={marking}
                  className="btn-primary group relative w-full cursor-pointer overflow-hidden rounded-md py-3.5 text-xs font-semibold tracking-wide uppercase text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="relative z-10">{marking ? "Marking..." : "Mark as Reviewed"}</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
