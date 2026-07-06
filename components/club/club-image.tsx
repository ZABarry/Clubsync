"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { resolveClubImageFallbackUrl } from "@/lib/clubs/resolve-club-image";
import { cn } from "@/lib/utils";

type ClubImageProps = {
  clubId: string;
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  /** Load immediately for above-the-fold hero images (e.g. club detail) */
  priority?: boolean;
};

function canOptimizeImageUrl(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return (
      hostname === "picsum.photos" || hostname.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

function isLayoutClass(className: string): boolean {
  return (
    className.startsWith("aspect-") ||
    className.startsWith("size-") ||
    className.startsWith("h-") ||
    className.startsWith("w-") ||
    className.startsWith("max-w-") ||
    className.startsWith("min-h-") ||
    className.startsWith("min-w-") ||
    /^(sm|md|lg|xl|2xl):(aspect-|size-|h-|w-|max-w-|min-h-|min-w-)/.test(
      className,
    )
  );
}

function partitionImageClasses(className?: string): {
  layout: string;
  visual: string;
} {
  if (!className) return { layout: "", visual: "" };

  const layout: string[] = [];
  const visual: string[] = [];

  for (const part of className.split(/\s+/).filter(Boolean)) {
    if (isLayoutClass(part)) layout.push(part);
    else visual.push(part);
  }

  return { layout: layout.join(" "), visual: visual.join(" ") };
}

export function ClubImage({
  clubId,
  src,
  alt,
  className,
  wrapperClassName,
  priority = false,
}: ClubImageProps) {
  const fallbackSrc = resolveClubImageFallbackUrl(clubId);
  const hasPrimarySrc = Boolean(src.trim());
  const [displaySrc, setDisplaySrc] = useState(
    hasPrimarySrc ? src : fallbackSrc,
  );
  const [usingFallback, setUsingFallback] = useState(!hasPrimarySrc);

  useEffect(() => {
    const hasSrc = Boolean(src.trim());
    setDisplaySrc(hasSrc ? src : fallbackSrc);
    setUsingFallback(!hasSrc);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (usingFallback) return;
    setUsingFallback(true);
    setDisplaySrc(fallbackSrc);
  };

  const resolvedSrc = displaySrc.trim() || fallbackSrc;

  const { layout, visual } = partitionImageClasses(className);
  const wrapperClasses = cn(
    "relative overflow-hidden",
    wrapperClassName,
    layout,
  );
  const imageClasses = cn("absolute inset-0 size-full object-cover", visual);
  const useNextImage =
    !usingFallback && canOptimizeImageUrl(resolvedSrc);

  if (useNextImage) {
    return (
      <div className={wrapperClasses}>
        <Image
          key={resolvedSrc}
          src={resolvedSrc}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={imageClasses}
          priority={priority}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={resolvedSrc}
        src={resolvedSrc}
        alt={alt}
        className={imageClasses}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={handleError}
      />
    </div>
  );
}
