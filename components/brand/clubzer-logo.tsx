"use client";

type ClubZerLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { mark: 28, text: "text-base", gap: "gap-2" },
  md: { mark: 32, text: "text-lg", gap: "gap-2.5" },
  lg: { mark: 44, text: "text-2xl", gap: "gap-3" },
};

export function ClubZerMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const bgId = "clubzer-logo-bg";
  const px = sizes[size].mark;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill={`url(#${bgId})`} />

      <path
        d="M15 16H33L21 24H31"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 32H33"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="32" r="4.5" fill="#FDE047" stroke="white" strokeWidth="1.5" />

      <defs>
        <linearGradient
          id={bgId}
          x1="6"
          y1="4"
          x2="44"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF6B54" />
          <stop offset="0.55" stopColor="#FF9346" />
          <stop offset="1" stopColor="#FFB347" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ClubZerLogo({
  className,
  showWordmark = true,
  size = "md",
}: ClubZerLogoProps) {
  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center ${s.gap} ${className ?? ""}`}
    >
      <ClubZerMark size={size} />
      {showWordmark ? (
        <span className={`${s.text} leading-none tracking-tight`}>
          <span className="font-bold text-foreground">Club</span>
          <span className="font-extrabold text-primary">Zer</span>
        </span>
      ) : null}
    </span>
  );
}
