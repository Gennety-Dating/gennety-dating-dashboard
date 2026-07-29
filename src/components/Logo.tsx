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
      <svg
        viewBox="0 0 500 500"
        className="h-full w-full object-cover"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cherry-butterfly-bg" cx="30%" cy="88%" r="90%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="25%" stopColor="#be123c" />
            <stop offset="65%" stopColor="#70092b" />
            <stop offset="100%" stopColor="#2e030f" />
          </radialGradient>
        </defs>

        {/* Background rounded squircle */}
        <rect width="500" height="500" rx="135" fill="url(#cherry-butterfly-bg)" />

        {/* White butterfly emblem matching the user brand logo */}
        <path
          fill="#FFFFFF"
          d="M 250 195
             C 215 130, 105 135, 95 210
             C 85 270, 140 330, 205 310
             C 140 335, 100 405, 150 415
             C 205 425, 245 355, 250 305
             C 255 355, 295 425, 350 415
             C 400 405, 360 335, 295 310
             C 360 330, 415 270, 405 210
             C 395 135, 285 130, 250 195 Z"
        />
      </svg>
    </div>
  );
}
