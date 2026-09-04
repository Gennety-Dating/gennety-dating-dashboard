interface ErrorBannerProps {
  message: string;
  className?: string;
}

/**
 * The one error surface. This markup was pasted into eleven places, drifting
 * in padding and radius as it went; rose belongs to failure on this screen, so
 * it is worth having exactly one definition of what failure looks like.
 */
export default function ErrorBanner({ message, className }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={`rounded-md border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300 ${className ?? ""}`}
    >
      {message}
    </div>
  );
}
