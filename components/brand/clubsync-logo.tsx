"use client";

import { useId } from "react";

type ClubSyncLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { mark: 28, text: "text-base", gap: "gap-2" },
  md: { mark: 32, text: "text-lg", gap: "gap-2.5" },
  lg: { mark: 44, text: "text-2xl", gap: "gap-3" },
};

export function ClubSyncMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const uid = useId().replace(/:/g, "");
  const bgId = `clubsync-bg-${uid}`;
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

      {/* Interlocking rings — clubs linking together */}
      <circle
        cx="19"
        cy="24"
        r="11"
        stroke="white"
        strokeWidth="3.2"
        strokeOpacity="0.95"
      />
      <circle cx="29" cy="24" r="11" stroke="#F4A261" strokeWidth="3.2" />

      {/* Sync pulse at overlap */}
      <circle cx="24" cy="24" r="3.5" fill="white" />
      <path
        d="M24 17.5V14M24 34V30.5"
        stroke="#7ECFCF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17.5 24H14M34 24H30.5"
        stroke="#7ECFCF"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <defs>
        <linearGradient
          id={bgId}
          x1="6"
          y1="4"
          x2="44"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0F4C5C" />
          <stop offset="1" stopColor="#2A8F9A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ClubSyncLogo({
  className,
  showWordmark = true,
  size = "md",
}: ClubSyncLogoProps) {
  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center ${s.gap} ${className ?? ""}`}
    >
      <ClubSyncMark size={size} />
      {showWordmark ? (
        <span className={`${s.text} leading-none tracking-tight`}>
          <span className="font-bold text-foreground">Club</span>
          <span className="font-bold text-primary">Sync</span>
        </span>
      ) : null}
    </span>
  );
}
