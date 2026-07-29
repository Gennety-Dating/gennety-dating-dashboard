import type { UserListItem } from "../../lib/api";

interface Props {
  users: UserListItem[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 shadow-sm",
  onboarding: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 shadow-sm",
  paused: "bg-slate-500/10 text-slate-400 ring-1 ring-white/10 shadow-sm",
};

const STEP_STYLES: Record<string, string> = {
  completed: "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20 shadow-sm",
  conversational: "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20 shadow-sm",
  language: "bg-slate-500/10 text-slate-400 ring-1 ring-white/10 shadow-sm",
};

function Pill({ text, styles }: { text: string; styles: Record<string, string> }) {
  const cls = styles[text] ?? "bg-slate-500/10 text-slate-400 ring-1 ring-white/10";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cls}`}
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

export default function UsersTable({ users, loading, onRowClick }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900/60 shadow-xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.04] text-xs">
          <thead className="bg-slate-950/40">
            <tr className="text-left text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Gender</th>
              <th className="px-5 py-3.5">Preference</th>
              <th className="px-5 py-3.5">Onboarding</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 w-24 animate-pulse rounded-lg bg-slate-800/60" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-500">
                  No users found.
                </td>
              </tr>
            )}

            {!loading &&
              users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => onRowClick(u.id)}
                  className="group cursor-pointer transition-all duration-150 hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white transition-colors group-hover:text-violet-300">
                      {displayName(u)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {u.universityDomain ?? "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-300">
                    {u.gender ?? "—"}
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-300">
                    {u.preference ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <Pill text={u.onboardingStep} styles={STEP_STYLES} />
                  </td>
                  <td className="px-5 py-4">
                    <Pill text={u.status} styles={STATUS_STYLES} />
                  </td>
                  <td className="px-5 py-4 text-slate-400">
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
