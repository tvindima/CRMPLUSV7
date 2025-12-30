export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) return `https://${vercelUrl.trim()}`;

  return "https://imoveismais-site.vercel.app";
}
