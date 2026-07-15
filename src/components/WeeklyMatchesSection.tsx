import { useEffect, useState } from "react";
import {
  getWeeklyMatches,
  type WeeklyMatchesData,
  type WeeklyMatchesPair,
  type WeeklyMatchesUserCard,
  type MediaType,
} from "../lib/api";
import AuthedImage from "./AuthedImage";
import SectionHeader from "./SectionHeader";

/**
 * Weekly matches — the full per-pair view (both users' data + photos +
 * attractiveness score), parity with the founder report page. Self-fetches on
 * mount (heavy view with many images) so it doesn't add to the dashboard's
 * initial fan-out. `weekOf` omitted → the backend returns the last 7 days.
 */

// Telegram file_ids carry no slash; Supabase object paths do. The admin media
// proxy picks its downloader by `type`, so route each ref accordingly.
function refMediaType(ref: string): MediaType {
  return ref.includes("/") ? "photo" : "telegram";
}

function UserCard({ user }: { user: WeeklyMatchesUserCard }) {
  const meta = [user.gender, user.city, user.verificationStatus]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-white">
          {user.firstName ?? "—"}
          {user.age != null ? `, ${user.age}` : ""}
        </span>
        {user.attractiveness != null ? (
          <span className="text-xs text-amber-400">⭐ {user.attractiveness}/100</span>
        ) : (
          <span className="text-xs text-slate-600">no score</span>
        )}
      </div>
      <div className="mt-0.5 text-xs text-slate-400">{meta}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {user.photoRefs.map((ref) => (
          <AuthedImage
            key={ref}
            mediaType={refMediaType(ref)}
            refKey={ref}
            className="h-16 w-16 rounded-lg object-cover"
          />
        ))}
      </div>
    </div>
  );
}

function PairCard({ pair }: { pair: WeeklyMatchesPair }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">
          {pair.status}
        </span>
        {pair.synergyScore != null && (
          <span className="ml-auto text-xs text-amber-400/90">
            Synergy {pair.synergyScore}
          </span>
        )}
      </div>
      <div className="flex items-start gap-4">
        <UserCard user={pair.users[0]} />
        <div className="self-center text-slate-600">✕</div>
        <UserCard user={pair.users[1]} />
      </div>
      {pair.synergyReason && (
        <p className="mt-3 text-xs italic text-slate-400">{pair.synergyReason}</p>
      )}
    </div>
  );
}

export default function WeeklyMatchesSection() {
  const [data, setData] = useState<WeeklyMatchesData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getWeeklyMatches()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Loading weekly matches…</p>;
  }

  const week = new Date(data.weekOf).toLocaleDateString(undefined, {
    dateStyle: "long",
  });

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Weekly matches"
        description={`Pairs from the last drop · since ${week} · ${data.pairs.length} pairs`}
      />
      {data.pairs.length === 0 ? (
        <p className="text-sm text-slate-500">No pairs in this window.</p>
      ) : (
        <div className="grid gap-3">
          {data.pairs.map((pair) => (
            <PairCard key={pair.matchId} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
}
