"use client";

import { manufacturerImageUrl, partImageUrlForPartName } from "@/lib/garage/part-image";

type Size = "sm" | "md";

const SIZE: Record<Size, string> = {
  sm: "h-7 w-7 min-h-7 min-w-7",
  md: "h-9 w-9 min-h-9 min-w-9",
};

type PartProps = {
  partName: string;
  className?: string;
  size?: Size;
};

/**
 * Part inventory icon from `/garage-ui/` when a generated filename match exists.
 */
export function PartThumbnail({ partName, className = "", size = "sm" }: PartProps) {
  const src = partImageUrlForPartName(partName);
  if (!src) {
    return (
      <span
        className={`ac6-part-thumb-fallback shrink-0 text-[8px] font-bold uppercase leading-none tracking-wider ${SIZE[size]} ${className}`}
        aria-hidden
      >
        —
      </span>
    );
  }
  return (
    <span className={`inline-flex shrink-0 ${className}`}>
      <img
        src={src}
        alt=""
        className={`ac6-part-thumb-img ${SIZE[size]}`}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

type MfgProps = {
  manufacturer: string;
  className?: string;
  size?: Size;
};

export function ManufacturerThumbnail({ manufacturer, className = "", size = "sm" }: MfgProps) {
  const src = manufacturerImageUrl(manufacturer);
  if (!src) {
    return (
      <span
        className={`ac6-part-thumb-fallback shrink-0 text-[7px] font-bold uppercase leading-none ${SIZE[size]} ${className}`}
        aria-hidden
      >
        ·
      </span>
    );
  }
  return (
    <span className={`inline-flex shrink-0 ${className}`}>
      <img
        src={src}
        alt=""
        className={`ac6-part-thumb-img ${SIZE[size]}`}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
