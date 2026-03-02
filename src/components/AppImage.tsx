"use client";

import Image, { ImageProps } from "next/image";

/**
 * A drop-in replacement for next/image that handles:
 * - Full URLs (https://storage.googleapis.com/...) → uses next/image with optimization
 * - Local paths (/uploads/...) in dev → uses next/image with unoptimized flag
 */
type AppImageProps = Omit<ImageProps, "unoptimized"> & { alt: string };

export default function AppImage({ src, ...props }: AppImageProps) {
  const isLocal =
    typeof src === "string" && src.startsWith("/uploads/");

  {/* eslint-disable-next-line jsx-a11y/alt-text */}
  return <Image src={src} unoptimized={isLocal} {...props} />;
}
