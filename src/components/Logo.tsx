interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "h-11 w-11", size }: LogoProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div
      style={style}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-xl shadow-rose-950/60 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_0_14px_rgba(255,255,255,0.15)] ${className}`}
    >
      <img
        src="/logo.svg"
        alt="Gennety Logo"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
