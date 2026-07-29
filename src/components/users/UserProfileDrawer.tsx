import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserDetail, type UserDetail } from "../../lib/api";
import { toTagList } from "../../lib/tags";
import PsychProfileBlock from "./PsychProfileBlock";
import ChatHistoryBlock from "./ChatHistoryBlock";

interface Props {
  userId: string | null;
  onClose: () => void;
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

function TagList({ items }: { items: string[] | string | undefined | null }) {
  const tags = toTagList(items);
  if (tags.length === 0) return <span className="text-slate-500">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-200"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function displayName(u: UserDetail): string {
  const parts = [u.firstName, u.surname].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `tg:${u.telegramId}`;
}

export default function UserProfileDrawer({ userId, onClose }: Props) {
  const [result, setResult] = useState<{
    userId: string;
    detail: UserDetail | null;
    error: string;
  } | null>(null);

  const loading = userId !== null && (result === null || result.userId !== userId);
  const detail = result && result.userId === userId ? result.detail : null;
  const error = result && result.userId === userId ? result.error : "";

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getUserDetail(userId)
      .then((d) => {
        if (cancelled) return;
        setResult({ userId, detail: d, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({
          userId,
          detail: null,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [userId, onClose]);

  const open = userId !== null;

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
          <h2 className="text-base font-semibold text-white">User Profile</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg border border-slate-700 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Header card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {displayName(detail)}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-400">
                      Telegram ID: {detail.telegramId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-wider text-slate-500 uppercase">
                      Registered
                    </p>
                    <p className="text-sm text-slate-300">
                      {new Date(detail.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field label="Age" value={detail.age ?? "—"} />
                  <Field
                    label="Gender"
                    value={
                      <span className="capitalize">{detail.gender ?? "—"}</span>
                    }
                  />
                  <Field
                    label="Preference"
                    value={
                      <span className="capitalize">{detail.preference ?? "—"}</span>
                    }
                  />
                  <Field label="Language" value={detail.language ?? "—"} />
                  <Field label="Major" value={detail.major ?? "—"} />
                  <Field label="University" value={detail.universityDomain ?? "—"} />
                  <Field label="Email" value={detail.email ?? "—"} />
                  <Field
                    label="Status"
                    value={<span className="capitalize">{detail.status}</span>}
                  />
                  <Field
                    label="Onboarding"
                    value={
                      <span className="capitalize">{detail.onboardingStep}</span>
                    }
                  />
                </div>
              </div>

              {/* Psychological summary — prominent AI block */}
              <section>
                <h4 className="mb-3 text-sm font-semibold text-white">
                  Psychological Dump
                </h4>
                <PsychProfileBlock
                  summary={detail.profile?.psychologicalSummary ?? null}
                />
              </section>

              {/* Profile attributes */}
              {detail.profile && (
                <section>
                  <h4 className="mb-3 text-sm font-semibold text-white">
                    Profile
                  </h4>
                  <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <Field
                        label="Height"
                        value={
                          detail.profile.height ? `${detail.profile.height} cm` : "—"
                        }
                      />
                      <Field
                        label="Age Range"
                        value={
                          detail.profile.ageRangeMin && detail.profile.ageRangeMax
                            ? `${detail.profile.ageRangeMin}–${detail.profile.ageRangeMax}`
                            : "—"
                        }
                      />
                      <Field
                        label="Photos"
                        value={`${detail.profile.photos?.length ?? 0} uploaded`}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                        Hobbies
                      </p>
                      <TagList items={detail.profile.hobbies} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                        Partner Preferences
                      </p>
                      <TagList items={detail.profile.partnerPreferences} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                        Visual Preferences
                      </p>
                      <TagList items={detail.profile.visualPreferences} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                        Negative Constraints
                      </p>
                      <TagList items={detail.profile.negativeConstraints} />
                    </div>
                  </div>
                </section>
              )}

              {/* Chat history — quick preview; full transcript (with images
                  + technical toggle) lives on the dedicated route. */}
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-white">
                    Chat History
                  </h4>
                  <Link
                    to={`/users/${detail.id}`}
                    className="shrink-0 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                  >
                    Open full conversation →
                  </Link>
                </div>
                <ChatHistoryBlock messages={detail.messageHistory ?? null} />
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
