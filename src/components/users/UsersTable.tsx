import type { UserListItem } from "../../lib/api";

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

const STEP_STYLES: Record<string, string> = {
  completed: "bg-white/15 text-white [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.25)]",
  conversational: "bg-slate-200/15 text-slate-200 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.15)]",
  language: "bg-[#17181c] text-slate-400 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.1)]",
};

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

export default function UsersTable({ users, loading, onRowClick }: Props) {
  return (
    <div className="glass-card-borderless overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.03] text-xs">
          <thead className="bg-[#121316]">
            <tr className="text-left text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Gender</th>
              <th className="px-6 py-4">Preference</th>
              <th className="px-6 py-4">Onboarding</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3.5 w-24 animate-pulse rounded-xl bg-slate-800/50" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-xs font-medium text-slate-500">
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
                  <td className="px-6 py-4 capitalize font-medium text-slate-300">
                    {u.preference ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Pill text={u.onboardingStep} styles={STEP_STYLES} />
                  </td>
                  <td className="px-6 py-4">
                    <Pill text={u.status} styles={STATUS_STYLES} />
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
