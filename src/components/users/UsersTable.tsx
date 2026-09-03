import type { UserListItem } from "../../lib/api";
import { HEALTH_LABELS, HEALTH_STYLES } from "../../lib/health";

interface Props {
  users: UserListItem[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-white/15 text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.25)]",
  onboarding: "bg-slate-200/15 text-slate-200 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]",
  paused: "bg-[#17181c] text-slate-400 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]",
};

const VERIFICATION_STYLES: Record<string, string> = {
  verified: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-300",
  pending_review: "bg-amber-500/15 text-amber-300",
  pending: "bg-sky-500/15 text-sky-300",
};

const STEP_STYLES: Record<string, string> = {
  completed: "bg-white/15 text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.25)]",
  conversational: "bg-slate-200/15 text-slate-200 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]",
  language: "bg-[#17181c] text-slate-400 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]",
};

/**
 * Elo → the 0..100 attractiveness the vision pass actually produced.
 *
 * The seed maps 0..100 onto Elo 200..800 at 6 Elo per point, so the raw Elo is
 * reversible — and far more legible than a four-digit rating in a table. An
 * unseeded profile sits at the 500 default, which is NOT a score: showing it as
 * one would invent a measurement that was never taken.
 */
function Attractiveness({ profile }: { profile: UserListItem["profile"] }) {
  const elo = profile?.eloScore;
  // `eloSeededAt` may be absent (a server that does not return it) rather than
  // null (never seeded), so the score itself is the fallback evidence: 500 is
  // the un-seeded default, anything else was measured.
  if (typeof elo !== "number" || (profile?.eloSeededAt == null && elo === 500)) {
    return <span className="text-[11px] font-medium text-slate-500">—</span>;
  }
  const score = Math.round(Math.min(Math.max((elo - 200) / 6, 0), 100));
  return (
    <span className="font-bold text-white">
      {score}
      <span className="ml-1 text-[10px] font-medium text-slate-500">({elo})</span>
    </span>
  );
}

/**
 * Where this person is, and whether we can match them there.
 *
 * The status comes from the server, never from the city name: a launched
 * market and a city on the expansion list look identical in a table, and the
 * difference is the whole question — one of these people can be matched this
 * week, the other is waiting for us to open. A user who has not reached the
 * city step yet is a dash, which is a third state and not "no city".
 */
function CityCell({ user }: { user: UserListItem }) {
  const city = user.city;
  // A server a deploy behind sends no `city` at all. Fall back to the raw
  // profile name with NO badge rather than inventing a status: claiming
  // "active" for a city we cannot check is the one thing this column must
  // never do.
  if (city === undefined) {
    return (
      <span className="font-medium text-slate-300">{user.profile?.homeCity ?? "—"}</span>
    );
  }
  if (!city) return <span className="font-medium text-slate-600">—</span>;
  return (
    <div>
      <div className="font-medium text-slate-300">{city.city}</div>
      {city.status === "waitlist" ? (
        <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
          Waitlist
        </span>
      ) : (
        <div className="text-[10px] font-medium text-slate-500">{city.countryCode ?? ""}</div>
      )}
    </div>
  );
}

function Pill({ text, styles }: { text: string; styles: Record<string, string> }) {
  const cls = styles[text] ?? "bg-[#17181c] text-slate-300 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold capitalize ${cls}`}
    >
      {text}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function displayName(u: UserListItem): string {
  const parts = [u.firstName, u.surname].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `tg:${u.telegramId}`;
}

/**
 * Lifetime spend. A user who has never paid renders as a muted dash rather
 * than `$0.00`, so "never bought anything" stays visually distinct from a
 * genuine zero-value row.
 */
function Spent({ summary }: { summary: UserListItem["purchaseSummary"] }) {
  if (!summary || summary.count === 0) {
    return <span className="font-medium text-slate-600">—</span>;
  }
  return (
    <div>
      <div className="font-bold text-white">${(summary.usdCents / 100).toFixed(2)}</div>
      <div className="text-[11px] font-medium text-slate-500">
        {summary.count} purchase{summary.count === 1 ? "" : "s"}
        {summary.refundedCount > 0 ? ` · ${summary.refundedCount} refunded` : ""}
      </div>
    </div>
  );
}

/**
 * Класс здоровья строкой. Приходит с сервера уже посчитанным — выводить его
 * из status/verification на клиенте нельзя, разойдётся с /admin/stats.
 */
function HealthBadge({ health }: { health: UserListItem["health"] }) {
  const cls = health?.classification;
  if (!cls) return <span className="font-medium text-slate-600">—</span>;
  return (
    <div>
      <span
        className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold ${HEALTH_STYLES[cls]}`}
      >
        {HEALTH_LABELS[cls]}
      </span>
      {health?.subclass && (
        <div className="mt-1 text-[10px] font-medium text-slate-500">{health.subclass}</div>
      )}
    </div>
  );
}

export default function UsersTable({ users, loading, onRowClick }: Props) {
  return (
    <div className="glass-card-borderless overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.03] text-xs">
          <thead className="bg-[#121316]">
            <tr className="text-left text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Gender</th>
              <th
                className="px-6 py-4"
                title="Дом матчинга. «Waitlist» — человек выбрал город, который мы ещё не открыли: его нельзя смэтчить, регистрация остановлена на экране ожидания."
              >
                City
              </th>
              <th className="px-6 py-4" title="Seeded from the AI vision pass at verification; drives V_league">
                Attractiveness
              </th>
              <th className="px-6 py-4">Verified</th>
              <th className="px-6 py-4">Onboarding</th>
              <th className="px-6 py-4">Status</th>
              <th
                className="px-6 py-4"
                title="Классификация аккаунта: живой / застрял / зашёл и ушёл / остыл / подозрительный / тестовый. Считается сервером, только для чтения."
              >
                Health
              </th>
              <th
                className="px-6 py-4"
                title="Everything this user has ever paid for. Telegram Stars are converted at the documented $0.02/⭐ ticket rate, so the dollar figure is an estimate."
              >
                Spent
              </th>
              <th className="px-6 py-4">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3.5 w-24 animate-pulse rounded-xl bg-slate-800/50" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-xs font-medium text-slate-500">
                  No users found.
                </td>
              </tr>
            )}

            {!loading &&
              users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => onRowClick(u.id)}
                  className="group cursor-pointer transition-all duration-150 hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-white transition-colors group-hover:text-rose-300">
                      {displayName(u)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400">
                      {u.universityDomain ?? "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize font-medium text-slate-300">
                    {u.gender ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <CityCell user={u} />
                  </td>
                  <td className="px-6 py-4">
                    <Attractiveness profile={u.profile} />
                  </td>
                  <td className="px-6 py-4">
                    <Pill text={u.verificationStatus ?? "—"} styles={VERIFICATION_STYLES} />
                  </td>
                  <td className="px-6 py-4">
                    <Pill text={u.onboardingStep} styles={STEP_STYLES} />
                  </td>
                  <td className="px-6 py-4">
                    <Pill text={u.status} styles={STATUS_STYLES} />
                  </td>
                  <td className="px-6 py-4">
                    <HealthBadge health={u.health} />
                  </td>
                  <td className="px-6 py-4">
                    <Spent summary={u.purchaseSummary} />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-400">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
