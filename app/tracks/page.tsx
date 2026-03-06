import type { Metadata } from "next";
import { ARTIST_NAME } from "../lib/seo";
import TracksPageClient from "./TracksPageClient";

export const metadata: Metadata = {
  title: "Hip-Hop Releases",
  description: `Listen to ${ARTIST_NAME} releases, EPs and albums. Fresh hip-hop drops and complete discography.`,
  alternates: {
    canonical: "/tracks",
  },
  keywords: [
    ARTIST_NAME,
    `${ARTIST_NAME} releases`,
    "hip-hop releases",
    "rap albums",
    "new music",
  ],
};

export default function TracksPage() {
  return <TracksPageClient />;
}
