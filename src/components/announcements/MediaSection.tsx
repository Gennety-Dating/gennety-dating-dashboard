import { useRef, useState } from "react";
import {
  ANNOUNCEMENT_MEDIA,
  clearAnnouncementMedia,
  uploadAnnouncementMedia,
  type AdminAnnouncement,
  type AnnouncementMediaRole,
} from "../../lib/api";
import {
  STALE_CODES,
  describeError,
  errorCode,
  errorForCode,
  isAuthError,
} from "../../lib/announcements";

interface Props {
  /** `null` while the draft has never been saved — media hangs off a row id. */
  announcement: AdminAnnouncement | null;
  editable: boolean;
  /** A poster problem found by a schedule attempt, shown here where it is fixed. */
  posterError?: string;
  onUpdated: (announcement: AdminAnnouncement) => void;
  onStale: () => void;
  onAuthError: () => void;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPE = "video/mp4";

function codeMessage(code: string): string {
  return errorForCode(code)?.message ?? code;
}

/**
 * Checked here only to save a pointless multi-megabyte round trip. The server
 * decides from the bytes, not from `file.type`, so an empty or wrong browser
 * type is passed through for it to judge.
 */
function precheck(role: AnnouncementMediaRole, file: File): string | null {
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = file.type === VIDEO_TYPE;
  if (role === "poster" && file.type && !isImage) return codeMessage("poster_must_be_image");
  if (role === "media" && file.type && !isImage && !isVideo) return codeMessage("unsupported_media");
  if (isImage && file.size > ANNOUNCEMENT_MEDIA.imageMaxBytes) return codeMessage("image_too_large");
  if (isVideo && file.size > ANNOUNCEMENT_MEDIA.videoMaxBytes) return codeMessage("video_too_large");
  if (file.size > ANNOUNCEMENT_MEDIA.videoMaxBytes) return codeMessage("LIMIT_FILE_SIZE");
  return null;
}

type Busy = AnnouncementMediaRole | "clear" | null;

export default function MediaSection({ announcement, editable, posterError, onUpdated, onStale, onAuthError }: Props) {
  const mediaInput = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<{ role: AnnouncementMediaRole; message: string } | null>(null);

  const kind = announcement?.mediaKind ?? null;

  function fail(err: unknown, role: AnnouncementMediaRole) {
    if (isAuthError(err)) {
      onAuthError();
      return;
    }
    const described = describeError(err, role === "poster" ? "poster" : "media");
    setError({ role: described.field === "poster" ? "poster" : role, message: described.message });
    const code = errorCode(err);
    if (code && STALE_CODES.has(code)) onStale();
  }

  function handleFile(role: AnnouncementMediaRole, file: File | undefined) {
    if (!file || !announcement) return;
    const problem = precheck(role, file);
    if (problem) {
      setError({ role, message: problem });
      return;
    }
    setError(null);
    setBusy(role);
    uploadAnnouncementMedia(announcement.id, role, file)
      .then((res) => onUpdated(res.announcement))
      .catch((err: unknown) => fail(err, role))
      .finally(() => setBusy(null));
  }

  function handleClear() {
    if (!announcement) return;
    if (!window.confirm("Remove the media from this draft? The image or video and its poster both go.")) return;
    setError(null);
    setBusy("clear");
    clearAnnouncementMedia(announcement.id)
      .then((res) => onUpdated(res.announcement))
      .catch((err: unknown) => fail(err, "media"))
      .finally(() => setBusy(null));
  }

  const mediaMessage = error?.role === "media" ? error.message : "";
  const posterMessage = error?.role === "poster" ? error.message : posterError ?? "";
  const needsPoster = kind === "video" && !announcement?.posterUrl;

  return (
    <section className="panel rounded-lg p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">Media</h3>
        {kind && <span className="text-[10px] font-medium text-slate-500 uppercase">{kind}</span>}
      </div>

      {!announcement ? (
        <p className="text-xs text-slate-500">Save the draft first — media is attached to a saved announcement.</p>
      ) : (
        <>
          {!kind && (
            <p className="mb-3 text-xs text-slate-500">
              {editable ? "No media. Optional." : "No media."}
            </p>
          )}

          {kind && (
            <div className="mb-3 flex flex-wrap items-start gap-3">
              <figure className="min-w-0">
                {announcement.mediaUrl ? (
                  kind === "video" ? (
                    <video
                      src={announcement.mediaUrl}
                      poster={announcement.posterUrl ?? undefined}
                      muted
                      controls
                      playsInline
                      className="max-h-64 max-w-full rounded-md border border-white/10 bg-canvas"
                    />
                  ) : (
                    <img
                      src={announcement.mediaUrl}
                      alt="Announcement media"
                      className="max-h-64 max-w-full rounded-md border border-white/10 bg-canvas object-contain"
                    />
                  )
                ) : (
                  <div className="flex h-32 w-48 items-center justify-center rounded-md border border-white/10 bg-canvas px-3 text-center text-[10px] text-slate-500">
                    Preview link unavailable
                  </div>
                )}
              </figure>

              {kind === "video" && (
                <figure className="min-w-0">
                  {announcement.posterUrl ? (
                    <img
                      src={announcement.posterUrl}
                      alt="Video poster"
                      className="max-h-40 max-w-full rounded-md border border-white/10 bg-canvas object-contain"
                    />
                  ) : (
                    <div className="flex h-32 w-40 items-center justify-center rounded-md border border-dashed border-amber-500/30 px-3 text-center text-[10px] text-amber-300/90">
                      No poster yet
                    </div>
                  )}
                  <figcaption className="mt-1 text-[10px] text-slate-500">Poster</figcaption>
                </figure>
              )}
            </div>
          )}

          {editable && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => mediaInput.current?.click()}
                  className="btn cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === "media" ? "Uploading…" : kind ? "Replace media" : "Upload image or video"}
                </button>
                {kind === "video" && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => posterInput.current?.click()}
                    className="btn cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === "poster" ? "Uploading…" : announcement.posterUrl ? "Replace poster" : "Upload poster"}
                  </button>
                )}
                {kind && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={handleClear}
                    className="btn cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold text-rose-300/80 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === "clear" ? "Removing…" : "Remove media"}
                  </button>
                )}
              </div>

              {/* `value = ""` after every pick, so choosing the same file again still fires. */}
              <input
                ref={mediaInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4"
                className="hidden"
                onChange={(e) => {
                  handleFile("media", e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <input
                ref={posterInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  handleFile("poster", e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                One image (JPEG, PNG or WebP, up to 2 MB) or one MP4 (up to 8 MB and{" "}
                {ANNOUNCEMENT_MEDIA.videoMaxSeconds} s, silent). The app plays a video once and rests on its
                last frame.
              </p>
            </>
          )}

          {mediaMessage && (
            <p role="alert" className="mt-2 text-[11px] text-rose-300">
              {mediaMessage}
            </p>
          )}
          {posterMessage ? (
            <p role="alert" className="mt-2 text-[11px] text-rose-300">
              {posterMessage}
            </p>
          ) : (
            needsPoster &&
            editable && (
              <p className="mt-2 text-[11px] text-amber-300/90">
                A video needs a poster before it can be scheduled — it is the push cover and the frame shown
                before playback.
              </p>
            )
          )}
        </>
      )}
    </section>
  );
}
