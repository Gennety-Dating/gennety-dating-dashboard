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
  1: "bg-sky-950/40 text-sky-200 [box-shadow:inset_0_1px_1.5px_rgba(14,165,233,0.35)]",
  2: "bg-amber-950/40 text-amber-200 [box-shadow:inset_0_1px_1.5px_rgba(245,158,11,0.35)]",
  3: "bg-rose-950/60 text-rose-200 [box-shadow:inset_0_1px_1.5px_rgba(244,63,94,0.4),inset_0_0_16px_rgba(244,63,94,0.2)]",
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
      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
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
          className="rounded-xl bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-300 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/60 p-4 text-xs font-medium text-slate-400 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]">
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
    <section className="rounded-3xl bg-slate-950/70 p-6 shadow-2xl [box-shadow:inset_0_1px_1.5px_rgba(255,255,255,0.15)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {title}
          </p>
          <h4 className="mt-1 text-base font-extrabold text-white">
            {displayName(user)}
          </h4>
        </div>
        <div className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-300 uppercase [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]">
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
          <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Psychological Summary
          </p>
          {user.profile?.psychologicalSummary ? (
            <div className="rounded-2xl bg-rose-950/30 p-4 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3)]">
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
            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Hobbies
            </p>
            <TagList items={user.profile?.hobbies} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Partner Preferences
            </p>
            <TagList items={user.profile?.partnerPreferences} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
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
        className={`fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-[#121316]/95 shadow-2xl backdrop-blur-2xl [box-shadow:inset_1px_0_1px_rgba(255,255,255,0.1)] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#17181c]/95 px-6 py-4.5 backdrop-blur-xl [box-shadow:inset_0_-1px_0_rgba(255,255,255,0.06)]">
          <h2 className="text-base font-extrabold tracking-tight text-white">Report Detail</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inner-glow cursor-pointer rounded-2xl px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>

        {report && (
          <div className="space-y-6 px-6 py-6">
            <div
              className={`rounded-3xl p-5 ${TIER_COLORS[report.tier] ?? "bg-slate-950 text-slate-300 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]"}`}
            >
              <p className="text-xs font-extrabold tracking-tight">
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
              <h4 className="mb-3 text-xs font-extrabold tracking-tight text-white uppercase">
                AI Triage Summary
              </h4>
              {report.reasonSummary ? (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-950 to-slate-950 p-5.5 shadow-2xl [box-shadow:inset_0_1px_1.5px_rgba(244,63,94,0.35),inset_0_0_18px_rgba(244,63,94,0.1)]">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-400 to-rose-700" />
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-xl bg-rose-950/60 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-rose-200 uppercase [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.4)]">
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
              <h4 className="mb-3 text-xs font-extrabold tracking-tight text-white uppercase">
                User's Report
              </h4>
              <div className="rounded-3xl bg-slate-950/70 p-5.5 shadow-2xl [box-shadow:inset_0_1px_1.5px_rgba(255,255,255,0.15)]">
                <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap text-slate-200">
                  {report.rawText}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-3xl bg-slate-950/70 p-5.5 shadow-2xl [box-shadow:inset_0_1px_1.5px_rgba(255,255,255,0.15)]">
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
                  <p className="mb-3 rounded-2xl bg-rose-950/40 p-3 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3)]">
                    {markError}
                  </p>
                )}
                <button
                  onClick={handleMarkReviewed}
                  disabled={marking}
                  className="inner-glow-cherry group relative w-full cursor-pointer overflow-hidden rounded-2xl py-3.5 text-xs font-bold tracking-wide uppercase text-white shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
