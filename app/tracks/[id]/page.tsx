import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrackDetailClient from "./TrackDetailClient";
import { loadReleaseByIdServer } from "../../lib/releases-server";
import { ARTIST_NAME, getSiteUrl } from "../../lib/seo";
import { resolveTrackAssetSource } from "../../lib/audio-source";

interface TrackDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TrackDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const release = await loadReleaseByIdServer(id);

  if (!release) {
    return {
      title: "Release Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = `${release.title} by ${release.artist}. ${release.releaseType} with ${release.tracks.length} tracks. Listen on ${ARTIST_NAME} official website.`;
  const coverUrl = resolveTrackAssetSource(release.cover);

  return {
    title: `${release.title} (${release.releaseType})`,
    description,
    alternates: {
      canonical: `/tracks/${release.id}`,
    },
    keywords: [
      release.title,
      release.artist,
      `${release.title} tracks`,
      "hip-hop album",
      "rap release",
    ],
    openGraph: {
      type: "music.album",
      title: `${release.title} | ${release.artist}`,
      description,
      url: `/tracks/${release.id}`,
      images: [
        {
          url: coverUrl,
          alt: `${release.title} cover`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${release.title} | ${release.artist}`,
      description,
      images: [coverUrl],
    },
  };
}

export default async function TrackDetailPage({ params }: TrackDetailPageProps) {
  const { id } = await params;
  const release = await loadReleaseByIdServer(id);

  if (!release) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const releaseUrl = `${siteUrl}/tracks/${release.id}`;
  const coverUrl = resolveTrackAssetSource(release.cover);
  const albumJsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "@id": `${releaseUrl}#album`,
    name: release.title,
    byArtist: {
      "@type": "MusicGroup",
      name: release.artist,
    },
    datePublished: release.releaseDate,
    numTracks: release.tracks.length,
    image: coverUrl.startsWith("http") ? coverUrl : `${siteUrl}${coverUrl}`,
    url: releaseUrl,
    track: release.tracks.map((track, index) => ({
      "@type": "MusicRecording",
      position: index + 1,
      name: track.title,
      url: `${siteUrl}${track.audio}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(albumJsonLd) }}
      />
      <TrackDetailClient id={id} />
    </>
  );
}
