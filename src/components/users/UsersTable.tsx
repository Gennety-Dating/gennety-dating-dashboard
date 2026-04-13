import type { UserListItem } from "../../lib/api";

interface Props {
  users: UserListItem[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  onboarding: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  paused: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const STEP_STYLES: Record<string, string> = {
  completed: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  conversational: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  language: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function Pill({ text, styles }: { text: string; styles: Record<string, string> }) {
  const cls = styles[text] ?? "bg-slate-500/15 text-slate-300 border-slate-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
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
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60">
            <tr className="text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Gender</th>
              <th className="px-5 py-3">Preference</th>
              <th className="px-5 py-3">Onboarding</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}

            {!loading &&
              users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => onRowClick(u.id)}
                  className="cursor-pointer transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{displayName(u)}</div>
                    <div className="text-xs text-slate-500">
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
