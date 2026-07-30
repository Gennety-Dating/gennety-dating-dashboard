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
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        className="h-full w-full object-cover"
      >
        <defs>
          <radialGradient id="butterfly-radial-glow" cx="30%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#FF00FF" />
            <stop offset="30%" stopColor="#C82356" />
            <stop offset="70%" stopColor="#8B253B" />
            <stop offset="100%" stopColor="#3B0B1E" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" rx="26" fill="url(#butterfly-radial-glow)" />
        <path
          d="M 50 35 
             C 20 0, -10 30, 15 55 
             C -5 75, 25 100, 48 65 
             L 52 65 
             C 75 100, 105 75, 85 55 
             C 110 30, 80 0, 50 35 
             Z"
          fill="#FFFFFF"
          transform="translate(15, 15) scale(0.7)"
        />
      </svg>
    </div>
  );
}
