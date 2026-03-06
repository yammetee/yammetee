import type { Metadata } from "next";
import { ARTIST_NAME } from "../lib/seo";

export const metadata: Metadata = {
  title: "All Tracks",
  description: `Complete tracklist of ${ARTIST_NAME}. Stream all songs and discover new hip-hop records.`,
  alternates: {
    canonical: "/all-tracks",
  },
  keywords: [ARTIST_NAME, "all tracks", "hip-hop tracks", "rap songs"],
};

export default function AllTracksLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
