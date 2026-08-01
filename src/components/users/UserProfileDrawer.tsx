import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserDetail, type UserDetail, type UserMatchRow } from "../../lib/api";
import { toTagList } from "../../lib/tags";
import AuthedImage from "../AuthedImage";
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-3 text-xs font-bold tracking-tight text-white uppercase">{title}</h4>
      <div className="space-y-4 rounded-2xl bg-[#121316] p-5 shadow-xl ring-1 ring-white/5">
        {children}
      </div>
    </section>
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function pct(value: number | null | undefined): string {
  return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "—";
}

/**
 * The attractiveness league, in the terms the matching engine uses.
 *
 * `eloScore` is seeded at verification from the AI vision pass — 0..100
 * attractiveness maps onto Elo 200..800 at 6 Elo per point — and it is what
 * `V_league` reads when deciding who this person is viable with. Showing the
 * raw number alone hides that: 608 means nothing until you know 500 is the
 * unseeded default and the band is 200..800.
 */
function attractivenessFromElo(elo: number): number {
  return Math.round(Math.min(Math.max((elo - 200) / 6, 0), 100));
}

function EloBlock({ detail }: { detail: UserDetail }) {
  const elo = detail.profile?.eloScore;
  if (typeof elo !== "number") {
    return <span className="text-xs font-medium text-slate-500">No profile row.</span>;
  }
  const seededAt = detail.profile?.eloSeededAt;
  /*
   * Whether this is a MEASURED score or the un-seeded 500 default.
   *
   * `eloSeededAt` alone is not enough to decide: a server that does not return
   * the field sends `undefined`, which is not the same claim as `null` ("the
   * vision pass never ran"). Reading the two as one would announce "never
   * seeded" over a real, measured 608. The score itself is the fallback
   * evidence — anything off the 500 default came from somewhere.
   */
  const seeded = seededAt != null || elo !== 500;
  const seedTimeKnown = seededAt != null;
  const attractiveness = attractivenessFromElo(elo);
  // 200..800 is the seedable band; position the marker inside it.
  const position = Math.min(Math.max((elo - 200) / 6, 0), 100);

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Attractiveness score
          </p>
          <p className="mt-0.5 text-3xl font-black text-white">
            {seeded ? attractiveness : "—"}
            <span className="ml-1 text-sm font-bold text-slate-500">/ 100</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Elo
          </p>
          <p className="mt-0.5 text-xl font-black text-white">{elo}</p>
        </div>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#9f1239]"
          style={{ width: `${position}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium text-slate-500">
        <span>200</span>
        <span>500 · default</span>
        <span>800</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field
          label="Seeded"
          value={
            seedTimeKnown ? (
              formatDate(seededAt)
            ) : seeded ? (
              "yes"
            ) : (
              <span className="text-amber-300">never — using the 500 default</span>
            )
          }
        />
        <Field label="Matches played" value={detail.profile?.eloMatchesPlayed ?? 0} />
        <Field label="Standby (missed drops)" value={detail.profile?.standbyCount ?? "—"} />
      </div>
    </>
  );
}

const VERIFICATION_TONE: Record<string, string> = {
  verified: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  pending_review: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  pending: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  unverified: "bg-white/10 text-slate-300 ring-white/15",
};

function Badge({ text, tone }: { text: string; tone?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold ring-1 ${
        tone ?? "bg-white/10 text-slate-300 ring-white/15"
      }`}
    >
      {text}
    </span>
  );
}

function decisionLabel(value: boolean | null): string {
  if (value === true) return "accepted";
  if (value === false) return "declined";
  return "no answer";
}

function MatchRow({ m }: { m: UserMatchRow }) {
  return (
    <div className="rounded-xl bg-[#17181c] px-3.5 py-2.5 ring-1 ring-white/5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge text={m.status} />
        <span className="text-xs font-semibold text-slate-200">
          {m.partnerName ?? "—"}
        </span>
        {typeof m.synergyScore === "number" && (
          <span className="text-[11px] font-medium text-slate-400">
            synergy {m.synergyScore}
          </span>
        )}
        {m.source && m.source !== "weekly" && (
          <span className="text-[11px] font-medium text-slate-400">· {m.source}</span>
        )}
        <span className="ml-auto text-[10px] font-medium text-slate-500">
          {formatDate(m.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-[11px] font-medium text-slate-400">
        them: {decisionLabel(m.myDecision)} · partner: {decisionLabel(m.partnerDecision)}
        {m.venueName ? ` · ${m.venueName}` : ""}
        {m.agreedTime ? ` · ${formatDate(m.agreedTime)}` : ""}
      </p>
    </div>
  );
}

export default function UserProfileDrawer({ userId, onClose }: Props) {
  const [result, setResult] = useState<{
    userId: string;
    detail: UserDetail | null;
    error: string;
  }>({ userId: "", detail: null, error: "" });
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    setLoading(true);
    // `apiFetch` resolves to the payload itself and THROWS on failure — it has
    // no `{ data, error }` envelope. `/admin/users/:id` answers with the user
    // object flat, so the old `res.data` check was never true and every
    // successful load reported "Failed to load user".
    getUserDetail(userId)
      .then((detail) => {
        if (cancel) return;
        setResult({ userId, detail, error: "" });
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancel) return;
        const msg = err instanceof Error ? err.message : "Failed to load user";
        setResult({ userId, detail: null, error: msg });
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
  const photos = detail?.profile?.photos ?? [];
  const faceScores = detail?.profile?.photoFaceScores ?? [];

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
                      {detail.telegramUsername ? ` · @${detail.telegramUsername}` : ""}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Badge text={detail.status} />
                      {detail.verificationStatus && (
                        <Badge
                          text={detail.verificationStatus}
                          tone={VERIFICATION_TONE[detail.verificationStatus]}
                        />
                      )}
                      {detail.platform && detail.platform !== "telegram" && (
                        <Badge text={detail.platform} />
                      )}
                      {detail.registrationTrack && <Badge text={detail.registrationTrack} />}
                      {typeof detail.strikes === "number" && detail.strikes > 0 && (
                        <Badge
                          text={`${detail.strikes} strike${detail.strikes > 1 ? "s" : ""}`}
                          tone="bg-rose-500/15 text-rose-300 ring-rose-400/30"
                        />
                      )}
                    </div>
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
                    value={<span className="capitalize">{detail.gender ?? "—"}</span>}
                  />
                  <Field
                    label="Preference"
                    value={<span className="capitalize">{detail.preference ?? "—"}</span>}
                  />
                  <Field label="City" value={detail.profile?.homeCity ?? "—"} />
                  <Field label="Language" value={detail.language ?? "—"} />
                  <Field label="Timezone" value={detail.profile?.timeZone ?? "—"} />
                  <Field label="Phone" value={detail.phone ?? "—"} />
                  <Field label="Email" value={detail.email ?? "—"} />
                  <Field label="University" value={detail.universityDomain ?? "—"} />
                  <Field
                    label="Onboarding"
                    value={<span className="capitalize">{detail.onboardingStep}</span>}
                  />
                  {/* `?? 0` would report a balance the server never sent. */}
                  <Field label="Tickets" value={detail.ticketBalance ?? "—"} />
                  <Field
                    label="Premium"
                    value={
                      detail.premiumUntil
                        ? `until ${new Date(detail.premiumUntil).toLocaleDateString()}`
                        : "—"
                    }
                  />
                  <Field label="Last seen" value={formatDate(detail.lastMessageAt)} />
                  <Field label="Source" value={detail.referralSource ?? "organic"} />
                  <Field label="Major" value={detail.major ?? "—"} />
                </div>
              </div>

              {/* Attractiveness / standing */}
              <Section title="Attractiveness & standing">
                <EloBlock detail={detail} />
              </Section>

              {/* Photos — the thing being scored */}
              <Section title={`Photos (${photos.length})`}>
                {photos.length === 0 ? (
                  <span className="text-xs font-medium text-slate-500">
                    No photos on the profile.
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {photos.map((ref, i) => (
                      <button
                        key={`${ref}-${i}`}
                        type="button"
                        onClick={() => setLightbox(ref)}
                        className="cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-[#9f1239]"
                      >
                        <AuthedImage
                          mediaType="photo"
                          refKey={ref}
                          className="h-28 w-28 object-cover"
                        />
                        {/*
                          `photoFaceScores` is 1:1 with `photos`, so index i is
                          this photo's own match against the liveness selfie —
                          the number that decides whether the account verifies.
                        */}
                        <span className="block bg-[#17181c] px-1 py-0.5 text-center text-[10px] font-semibold text-slate-400">
                          face {pct(faceScores[i])}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Section>

              {/* Verification */}
              <Section title="Verification">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field
                    label="Status"
                    value={
                      <Badge
                        text={detail.verificationStatus ?? "—"}
                        tone={VERIFICATION_TONE[detail.verificationStatus ?? ""]}
                      />
                    }
                  />
                  <Field label="Verified at" value={formatDate(detail.verifiedAt)} />
                  <Field label="Best face match" value={pct(detail.faceMatchScore)} />
                  <Field
                    label="Reference selfie"
                    value={
                      detail.verifiedSelfiePath ? (
                        "on file"
                      ) : (
                        // The 90-day GDPR scrub deletes it, and AWS cannot
                        // re-issue one — so a photo edit needs a fresh liveness
                        // run rather than a rerun.
                        <span className="text-amber-300">scrubbed / never stored</span>
                      )
                    }
                  />
                  <Field label="Email verified" value={detail.isEmailVerified ? "yes" : "no"} />
                  <Field label="Phone verified" value={formatDate(detail.phoneVerifiedAt)} />
                </div>
                {detail.verifiedSelfiePath && (
                  <button
                    type="button"
                    onClick={() => setLightbox(detail.verifiedSelfiePath!)}
                    className="cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-[#9f1239]"
                  >
                    <AuthedImage
                      mediaType="photo"
                      refKey={detail.verifiedSelfiePath}
                      className="h-28 w-28 object-cover"
                    />
                  </button>
                )}
              </Section>

              {/* Matchability — why this person is or isn't in the pool */}
              <Section title="Matchability">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field label="Last matched" value={formatDate(detail.profile?.lastMatchedAt)} />
                  <Field label="Missed drops" value={detail.profile?.missedWeeks ?? "—"} />
                  <Field
                    label="Silent ignores"
                    value={detail.profile?.silentIgnoreCount ?? "—"}
                  />
                  <Field
                    label="Embedding"
                    value={
                      detail.profile?.embeddingDirty ? (
                        // Eligibility is fail-closed on this: a dirty profile is
                        // skipped by the weekly batch until the refresh cron
                        // catches up, which is a real and invisible reason for
                        // "why am I not getting matched".
                        <span className="text-amber-300">dirty — excluded from the batch</span>
                      ) : (
                        "fresh"
                      )
                    }
                  />
                  <Field
                    label="Energy axis"
                    value={detail.profile?.energyAxis?.toFixed(2) ?? "—"}
                  />
                  <Field
                    label="Orientation axis"
                    value={detail.profile?.orientationAxis?.toFixed(2) ?? "—"}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Anchor tags
                  </p>
                  <TagList items={detail.profile?.anchorTags} />
                </div>
              </Section>

              {/* Matches */}
              <Section
                title={detail.matches ? `Matches (${detail.matches.length})` : "Matches"}
              >
                {!detail.matches ? (
                  // An absent array is not an empty one: a server that predates
                  // this field would otherwise be reported as "never paired",
                  // which is a claim about the user rather than about the API.
                  <span className="text-xs font-medium text-slate-500">
                    Match history not available from this server.
                  </span>
                ) : detail.matches.length === 0 ? (
                  <span className="text-xs font-medium text-slate-500">
                    Never been paired.
                  </span>
                ) : (
                  <div className="space-y-2">
                    {detail.matches.map((m) => (
                      <MatchRow key={m.id} m={m} />
                    ))}
                  </div>
                )}
              </Section>

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
                <Section title="Profile">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field
                      label="Height"
                      value={detail.profile.height ? `${detail.profile.height} cm` : "—"}
                    />
                    <Field
                      label="Wants age"
                      value={
                        detail.profile.ageRangeMin && detail.profile.ageRangeMax
                          ? `${detail.profile.ageRangeMin}–${detail.profile.ageRangeMax}`
                          : "—"
                      }
                    />
                    <Field label="Ethnicity" value={detail.profile.ethnicity ?? "—"} />
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
                      Negative Constraints
                    </p>
                    <TagList items={detail.profile.negativeConstraints} />
                  </div>
                  {detail.profile.fridayVibeText && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        Ideal Friday
                      </p>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {detail.profile.fridayVibeText}
                      </p>
                    </div>
                  )}
                  {detail.profile.vibeFocusText && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        Experience vs company
                      </p>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {detail.profile.vibeFocusText}
                      </p>
                    </div>
                  )}
                </Section>
              )}

              {/* Profiler answers — the icebreaker fuel */}
              {detail.profilerAnswers && detail.profilerAnswers.length > 0 && (
                <Section title={`Profiler answers (${detail.profilerAnswers.length})`}>
                  <div className="space-y-2">
                    {detail.profilerAnswers.map((a) => (
                      <div key={a.questionId} className="text-xs">
                        <span className="font-mono text-[11px] text-slate-500">
                          {a.questionId}
                        </span>
                        <p
                          className={
                            a.skipped ? "text-slate-500 italic" : "font-medium text-slate-200"
                          }
                        >
                          {a.skipped ? "skipped" : (a.answerText ?? "—")}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
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

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#121316]/90 p-6 backdrop-blur-xl"
        >
          <AuthedImage
            mediaType="photo"
            refKey={lightbox}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>
      )}
    </>
  );
}
