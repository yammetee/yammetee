import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AudioProvider } from "./contexts/AudioContext";
import GlobalAudioPlayer from "./components/GlobalAudioPlayer";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import { ARTIST_KEYWORDS, ARTIST_NAME, getArtistJsonLd, getSiteUrl } from "./lib/seo";

const siteUrl = getSiteUrl();
const artistJsonLd = getArtistJsonLd();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${ARTIST_NAME} | Official Music`,
    template: `%s | ${ARTIST_NAME}`,
  },
  description:
    "Official music website of Yamme Tee: hip-hop releases, tracks, videos, and new drops.",
  applicationName: ARTIST_NAME,
  keywords: ARTIST_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${ARTIST_NAME} | Official Music`,
    description:
      "Hip-hop artist Yamme Tee. Listen to albums, tracks, and watch official videos.",
    siteName: ARTIST_NAME,
    images: [
      {
        url: "/favicon.svg",
        width: 512,
        height: 512,
        alt: `${ARTIST_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${ARTIST_NAME} | Official Music`,
    description:
      "Hip-hop artist Yamme Tee. Albums, tracks, and videos in one place.",
    images: ["/favicon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="flex min-h-screen flex-col"
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          width: "100vw",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(artistJsonLd) }}
        />
        <LanguageProvider>
          <AudioProvider>
            <Navigation />
            <div className="flex min-h-screen flex-1 flex-col">
              <main className="flex-1 pt-16">
                {children}
              </main>
              <Footer />
            </div>
            <GlobalAudioPlayer />
            <CookieConsent />
          </AudioProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
