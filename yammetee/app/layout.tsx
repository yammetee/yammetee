import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AudioProvider } from "./contexts/AudioContext";
import GlobalAudioPlayer from "./components/GlobalAudioPlayer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Yamme Tee",
  description: "Music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={poppins.className}
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          width: "100vw",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
        }}
      >
        <LanguageProvider>
          <AudioProvider>
            <Navigation />
            <main style={{ paddingTop: "64px", paddingBottom: "192px" }}>
              {children}
            </main>
            <GlobalAudioPlayer />
          </AudioProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
