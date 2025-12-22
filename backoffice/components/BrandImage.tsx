'use client';

import Image, { ImageProps } from "next/image";
import { useState } from "react";

type Props = Omit<ImageProps, "src"> & {
  src: string;
  fallbackSrc?: string;
};

export function BrandImage({ src, fallbackSrc = "/brand/placeholder.png", alt, ...rest }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={() => setCurrentSrc(fallbackSrc)}
      unoptimized={rest.unoptimized}
    />
  );
}
