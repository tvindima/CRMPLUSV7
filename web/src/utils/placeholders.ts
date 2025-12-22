import { Property } from "../services/publicApi";

const RENDER_COUNT = 42;

const sanitizeReference = (value?: string | null) => {
  if (!value) return null;
  return value.replace(/[^A-Za-z0-9_-]/g, "");
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export function getPlaceholderImage(seed?: string | number | null): string {
  if (!seed) return "/renders/7.jpg";
  const numericSeed = typeof seed === "number" ? seed : hashString(seed);
  const index = Math.abs(numericSeed % RENDER_COUNT) + 1;
  return `/renders/${index}.jpg`;
}

const getReferencePlaceholder = (property?: Property | null) => {
  const ref = sanitizeReference(property?.reference || property?.title || "");
  return ref ? `/placeholders/${ref}.jpg` : null;
};

const pickFirstImage = (property?: Property | null) => {
  if (!property?.images?.length) return null;
  return property.images.find((img) => Boolean(img)) || null;
};

export function getPropertyCover(property?: Property | null): string {
  // 1. Imagem real do backend (prioritário)
  const validImage = pickFirstImage(property);
  if (validImage) return validImage;
  
  // 2. Placeholder específico (SafeImage faz fallback se não existir)
  const referencePlaceholder = getReferencePlaceholder(property);
  if (referencePlaceholder) return referencePlaceholder;
  
  // 3. Render genérico (sempre existe)
  return getPlaceholderImage(property?.reference || property?.title || property?.id);
}

export function getPropertyGallery(property?: Property | null): string[] {
  const validImages = property?.images?.filter(Boolean);
  if (validImages?.length) return validImages;
  const referencePlaceholder = getReferencePlaceholder(property);
  if (referencePlaceholder) return [referencePlaceholder];
  return [getPlaceholderImage(property?.reference || property?.title || property?.id)];
}
