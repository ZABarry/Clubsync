"use client";

import { useState } from "react";

import { resolveClubImageFallbackUrl } from "@/lib/clubs/resolve-club-image";
import { cn } from "@/lib/utils";

type ClubImageProps = {
  clubId: string;
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
};

export function ClubImage({
  clubId,
  src,
  alt,
  className,
  wrapperClassName,
}: ClubImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <div className={wrapperClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={alt}
        className={cn(className)}
        onError={() => {
          const fallback = resolveClubImageFallbackUrl(clubId);
          if (currentSrc !== fallback) setCurrentSrc(fallback);
        }}
      />
    </div>
  );
}
