'use client';

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

type Props = Omit<ImageProps, "src"> & {
  src: string;
  fallbackSrc?: string;
};

export function BrandImage({ src, fallbackSrc = "/brand/placeholder.png", alt, ...rest }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Atualizar src quando a prop muda
  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc || fallbackSrc}
      onError={handleError}
      unoptimized
    />
  );
}
