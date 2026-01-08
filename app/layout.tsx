import type { Metadata } from "next";
import "./globals.css";

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
        style={{
          margin: 0,
          padding: 0,
          height: "100vh",
          width: "100vw",
          backgroundColor: "#0a0a0a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "'Zalando Sans SemiExpanded', sans-serif",
          color: "#ffffff",
          textAlign: "center",
        }}
      >
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zalando+Sans+SemiExpanded:ital,wght@0,200..900;1,200..900&display=swap"
          rel="stylesheet"
        />

        <h1
          style={{
            fontSize: "1em",
            fontWeight: 400,
            lineHeight: 1.1,
            textShadow: "1px 1px 6px rgba(0,0,0,0.4)",
          }}
        >
          Yamme Tee was here...
        </h1>

        {children}
      </body>
    </html>
  );
}
