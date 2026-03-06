import type { Metadata } from "next";
import { ARTIST_NAME } from "../lib/seo";

export const metadata: Metadata = {
  title: "Fan Wall",
  description: `Community wall of ${ARTIST_NAME}. Fan feedback, comments and support.`,
  alternates: {
    canonical: "/wall",
  },
  keywords: [ARTIST_NAME, "fan wall", "music community", "hip-hop fans"],
};

export default function WallLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
