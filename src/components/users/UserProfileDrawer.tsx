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
      <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-200">{value ?? "—"}</p>
    </div>
  );
}

function TagList({ items }: { items: string[] | string | undefined | null }) {
  const tags = toTagList(items);
  if (tags.length === 0) return <span className="text-xs font-medium text-slate-500">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="rounded-xl bg-[#121316] px-3 py-1 text-xs font-semibold text-slate-300 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]"
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
  }>({ userId: "", detail: null, error: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    setLoading(true);
    getUserDetail(userId).then((res: any) => {
      if (cancel) return;
      if (res.data) {
        setResult({ userId, detail: res.data, error: "" });
      } else {
        setResult({ userId, detail: null, error: res.error ?? "Failed to load user" });
      }
      setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, [userId]);

  const detail = result.userId === userId ? result.detail : null;
  const error = result.userId === userId ? result.error : "";

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
        className={`fixed inset-0 z-40 bg-[#121316]/80 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-[#121316]/95 shadow-2xl backdrop-blur-2xl [box-shadow:inset_1px_0_1px_rgba(255,255,255,0.1)] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#17181c]/95 px-6 py-4.5 backdrop-blur-xl [box-shadow:inset_0_-1px_0_rgba(255,255,255,0.06)]">
          <h2 className="text-base font-extrabold tracking-tight text-white">User Profile</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inner-glow cursor-pointer rounded-2xl px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-600 border-t-white" />
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl bg-rose-950/40 p-4 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3)]">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Header card */}
              <div className="rounded-3xl bg-[#121316] p-6 shadow-2xl [box-shadow:inset_0_1px_1.5px_rgba(255,255,255,0.15)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {displayName(detail)}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      Telegram ID: {detail.telegramId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      Registered
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-300">
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
                <h4 className="mb-3 text-xs font-bold tracking-tight text-white uppercase">
                  Psychological Dump
                </h4>
                <PsychProfileBlock
                  summary={detail.profile?.psychologicalSummary ?? null}
                />
              </section>

              {/* Profile attributes */}
              {detail.profile && (
                <section>
                  <h4 className="mb-3 text-xs font-bold tracking-tight text-white uppercase">
                    Profile
                  </h4>
                  <div className="space-y-4 rounded-2xl bg-[#121316] p-5 shadow-xl ring-1 ring-white/5">
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
                      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        Hobbies
                      </p>
                      <TagList items={detail.profile.hobbies} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        Partner Preferences
                      </p>
                      <TagList items={detail.profile.partnerPreferences} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        Visual Preferences
                      </p>
                      <TagList items={detail.profile.visualPreferences} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        Negative Constraints
                      </p>
                      <TagList items={detail.profile.negativeConstraints} />
                    </div>
                  </div>
                </section>
              )}

              {/* Chat history preview */}
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-xs font-bold tracking-tight text-white uppercase">
                    Chat History
                  </h4>
                  <Link
                    to={`/users/${detail.id}`}
                    className="shrink-0 rounded-xl bg-violet-600/20 px-3 py-1.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-500/30 transition-all hover:bg-violet-600/30"
                  >
                    Open full conversation &rarr;
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
