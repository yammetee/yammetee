import type { Metadata } from "next";
import { ARTIST_NAME } from "../lib/seo";

export const metadata: Metadata = {
  title: "Music Videos",
  description: `Watch official ${ARTIST_NAME} music videos and hip-hop clips.`,
  alternates: {
    canonical: "/videos",
  },
  keywords: [ARTIST_NAME, "music videos", "hip-hop videos", "rap clips"],
};

export default function VideosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
