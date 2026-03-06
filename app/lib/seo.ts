const FALLBACK_SITE_URL = "https://yammetee.com";

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return normalizeUrl(configured || FALLBACK_SITE_URL);
}

export const ARTIST_NAME = "Yamme Tee";

export const ARTIST_KEYWORDS = [
  "Yamme Tee",
  "Yamme Tee хип-хоп",
  "Yamme Tee hip hop",
  "русский хип-хоп",
  "hip-hop artist",
  "rap music",
  "new rap releases",
  "independent rapper",
];

export function getArtistJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${siteUrl}#artist`,
    name: ARTIST_NAME,
    genre: ["Hip-Hop", "Rap", "Alternative Hip-Hop"],
    url: siteUrl,
    mainEntityOfPage: siteUrl,
  };
}
