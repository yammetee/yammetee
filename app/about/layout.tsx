import type { Metadata } from "next";
import { ARTIST_NAME } from "../lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: `About ${ARTIST_NAME}: artist story, sound and creative direction.`,
  alternates: {
    canonical: "/about",
  },
  keywords: [ARTIST_NAME, "about artist", "hip-hop artist bio"],
};

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
