import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import ErrorBanner from "../components/ErrorBanner";
import SectionHeader from "../components/SectionHeader";
import AnnouncementEditor from "../components/announcements/AnnouncementEditor";
import AnnouncementList from "../components/announcements/AnnouncementList";
import AnnouncementSummary from "../components/announcements/AnnouncementSummary";
import {
  getAnnouncement,
  getAnnouncements,
  getCityCatalog,
  getEvents,
  type AdminAnnouncement,
  type ApiErrorDetails,
  type CityCatalogEntry,
} from "../lib/api";
import { describeError, isAuthError, type EventsState } from "../lib/announcements";

/**
 * Rich in-app announcements: write one, preview it on your own phone, then
 * schedule it for everyone it matches. The backend's `announcement-fanout`
 * worker does the delivery (docs/product/domains/inbox-and-announcements.md in
 * the backend repo); this page never sends anything itself.
 *
 * Same data conventions as the rest of the dashboard: loading is DERIVED from
 * a request key rather than set synchronously inside an effect, and a 404 with
 * no error code means "this server has not shipped the routes yet", which is
 * said quietly instead of as a red failure.
 */

/** While something is scheduled or delivering, the list re-reads itself this often. */
const LIVE_REFRESH_MS = 30_000;

interface Selection {
  /** The editor's React key. Kept when a new draft is first saved, so the form is not reset under the founder. */
  key: string;
  /** `null` = a new announcement not saved yet. */
  id: string | null;
}

interface DetailState {
  id: string;
  data: AdminAnnouncement | null;
  error: string;
}

export default function AnnouncementsPage() {
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);
  const [list, setList] = useState<{
    key: number;
    rows: AdminAnnouncement[];
    error: string;
    notDeployed: boolean;
  } | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [detailReload, setDetailReload] = useState(0);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const newCounter = useRef(0);
  const dirtyRef = useRef(false);
  // Read by write callbacks that may resolve after the founder has moved on.
  const selectionRef = useRef<Selection | null>(null);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const [events, setEvents] = useState<EventsState>({ status: "loading" });
  const [cities, setCities] = useState<CityCatalogEntry[]>([]);

  const goToLogin = useCallback(() => navigate("/login", { replace: true }), [navigate]);
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  // ── List ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    getAnnouncements()
      .then((res) => {
        if (!cancelled) setList({ key: refreshKey, rows: res.announcements, error: "", notDeployed: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isAuthError(err)) {
          goToLogin();
          return;
        }
        const { status, code } = (err as ApiErrorDetails | null) ?? {};
        if (status === 404 && !code) {
          setList({ key: refreshKey, rows: [], error: "", notDeployed: true });
          return;
        }
        // A failed refresh keeps the rows already on screen; only the banner is new.
        setList((prev) => ({
          key: refreshKey,
          rows: prev?.rows ?? [],
          error: describeError(err, "general").message,
          notDeployed: false,
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, goToLogin]);

  const rows = list?.rows ?? [];
  const listLoading = list === null;
  const refreshing = list !== null && list.key !== refreshKey;
  const notDeployed = list?.notDeployed ?? false;

  const hasLive = rows.some((a) => a.status === "scheduled" || a.status === "sending");
  useEffect(() => {
    if (!hasLive) return;
    const timer = window.setInterval(() => setRefreshKey((k) => k + 1), LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [hasLive]);

  // ── Lookups for the editor (both optional) ───────────────────────
  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((res) => {
        if (!cancelled) setEvents({ status: "ready", events: res.data });
      })
      .catch((err: unknown) => {
        if (cancelled || isAuthError(err)) return;
        // 404 = the events feature flag is off on this server: no picker at all.
        if ((err as ApiErrorDetails | null)?.status === 404) setEvents({ status: "off" });
        else setEvents({ status: "error", message: describeError(err, "eventId").message });
      });
    // The catalog only feeds city-key suggestions; without it the field still takes typed keys.
    getCityCatalog()
      .then((res) => {
        if (!cancelled) setCities(res.cities);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Detail ──────────────────────────────────────────────────────
  const selectedId = selection?.id ?? null;

  /**
   * Keep whichever copy of a row is newer. A write response and a GET started
   * before it can land in either order; `updatedAt` decides, so an upload is
   * never visually undone by a slower read.
   */
  const accept = useCallback((a: AdminAnnouncement) => {
    setDetail((prev) =>
      prev && prev.id === a.id && prev.data && prev.data.updatedAt > a.updatedAt
        ? prev
        : { id: a.id, data: a, error: "" },
    );
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    getAnnouncement(selectedId)
      .then((res) => {
        if (!cancelled) accept(res.announcement);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isAuthError(err)) {
          goToLogin();
          return;
        }
        const message = describeError(err, "general").message;
        // A row that is gone must not keep rendering as editable; any other
        // failure keeps what is already on screen and says so above it.
        const gone = (err as ApiErrorDetails | null)?.code === "not_found";
        setDetail((prev) =>
          prev && prev.id === selectedId && prev.data && !gone
            ? { ...prev, error: message }
            : { id: selectedId, data: null, error: message },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, detailReload, accept, goToLogin]);

  const currentDetail = selectedId && detail?.id === selectedId ? detail : null;
  const detailLoading = selectedId !== null && (currentDetail === null || (!currentDetail.data && !currentDetail.error));

  // The list re-reads every 30 s while something is live, and its counters
  // (read, pending pushes, status) are fresher than the opened copy's. Every
  // field but the signed media links is in the list row, so an equal-or-newer
  // row replaces the detail — without a GET that would re-sign the links and
  // restart a playing video every 30 seconds.
  const listRow = selectedId ? rows.find((r) => r.id === selectedId) : undefined;
  const shown: AdminAnnouncement | null =
    currentDetail?.data && listRow && listRow.updatedAt >= currentDetail.data.updatedAt
      ? { ...listRow, mediaUrl: currentDetail.data.mediaUrl, posterUrl: currentDetail.data.posterUrl }
      : currentDetail?.data ?? null;

  // ── Actions ─────────────────────────────────────────────────────
  function confirmLeave(): boolean {
    return !dirtyRef.current || window.confirm("Discard your unsaved changes to this draft?");
  }

  function select(id: string) {
    if (id === selectedId) return;
    if (!confirmLeave()) return;
    setSelection({ key: id, id });
  }

  function startNew() {
    if (!confirmLeave()) return;
    newCounter.current += 1;
    setSelection({ key: `new-${newCounter.current}`, id: null });
  }

  /**
   * A write came back. `key` is the selection that made it: if the founder has
   * since opened something else (or started another new draft), the response
   * must not take over the pane — it only refreshes the list.
   */
  function handleChanged(key: string, a: AdminAnnouncement) {
    const current = selectionRef.current;
    if (current?.key === key) {
      accept(a);
      // First save of a new draft: the row now has an id, the form keeps its key.
      if (current.id === null) setSelection({ key, id: a.id });
    }
    setRefreshKey((k) => k + 1);
  }

  function handleStale() {
    setDetailReload((k) => k + 1);
    setRefreshKey((k) => k + 1);
  }

  const visibleRows = showArchived ? rows : rows.filter((a) => a.status !== "archived");
  const archivedCount = rows.length - rows.filter((a) => a.status !== "archived").length;

  return (
    <div className="min-h-screen bg-canvas px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader />

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Announcements"
          description="Rich in-app announcements for the iOS inbox. Write, preview on your own phone, then send to everyone it matches."
        />

        {notDeployed ? (
          <div className="rounded-md bg-slate-900/60 p-4 text-xs font-medium text-slate-400">
            Not on this server yet — the backend deploy carrying the announcement routes has not landed. Nothing
            is wrong; this page works once it does.
          </div>
        ) : (
          <>
            {list?.error && <ErrorBanner className="mb-4" message={list.error} />}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
              {/* ── List pane ─────────────────────────────────── */}
              <div className="panel flex max-h-[45vh] flex-col overflow-hidden rounded-lg lg:sticky lg:top-2 lg:max-h-[calc(100vh-1rem)] lg:self-start">
                <div className="border-b border-white/10 p-3">
                  <button
                    type="button"
                    onClick={startNew}
                    className="btn-primary w-full cursor-pointer rounded-md py-2 text-xs font-semibold text-white"
                  >
                    New announcement
                  </button>
                </div>
                <AnnouncementList
                  rows={visibleRows}
                  loading={listLoading}
                  refreshing={refreshing}
                  selectedId={selectedId}
                  composingNew={selection !== null && selection.id === null}
                  showArchived={showArchived}
                  archivedCount={archivedCount}
                  onSelect={select}
                  onShowArchivedChange={setShowArchived}
                  onRefresh={() => setRefreshKey((k) => k + 1)}
                />
              </div>

              {/* ── Detail pane ───────────────────────────────── */}
              <div className="min-w-0">
                {selection === null ? (
                  <div className="panel flex min-h-[20rem] items-center justify-center rounded-lg p-6 text-center text-xs font-medium text-slate-500">
                    {listLoading
                      ? "Loading announcements…"
                      : rows.length === 0
                        ? "Nothing sent yet. Start with New announcement."
                        : "Select an announcement, or start a new one."}
                  </div>
                ) : selection.id !== null && detailLoading ? (
                  <div className="panel flex min-h-[20rem] items-center justify-center rounded-lg">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
                  </div>
                ) : selection.id !== null && !shown ? (
                  <ErrorBanner message={currentDetail?.error || "This announcement could not be loaded."} />
                ) : (
                  <>
                    {selection.id !== null && currentDetail?.error && (
                      <ErrorBanner className="mb-4" message={currentDetail.error} />
                    )}
                    {/* ONE slot for both the new and the saved draft. React keeps
                        state by position as well as key, so rendering them from two
                        branches would remount the editor on its first save and drop
                        whatever it was doing — a preview result, a half-typed field. */}
                    {selection.id === null || shown?.status === "draft" ? (
                      <AnnouncementEditor
                        key={selection.key}
                        announcement={selection.id === null ? null : shown}
                        events={events}
                        cities={cities}
                        onSaved={(a) => handleChanged(selection.key, a)}
                        onDirtyChange={handleDirtyChange}
                        onStale={handleStale}
                        onAuthError={goToLogin}
                      />
                    ) : (
                      shown && (
                        <AnnouncementSummary
                          key={selection.key}
                          announcement={shown}
                          events={events}
                          onUpdated={(a) => handleChanged(selection.key, a)}
                          onStale={handleStale}
                          onAuthError={goToLogin}
                        />
                      )
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
