import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
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
        style={{
          margin: 0,
          padding: 0,
          height: "100%",
          width: "100%",
          backgroundColor: "#0a0a0a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "'Playfair Display', serif",
          color: "#ffffff", // белый текст
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "8vw",
            fontWeight: 700,
            lineHeight: 1.1,
            textShadow: "2px 2px 8px rgba(0,0,0,0.5)", // лёгкая тень для глубины
          }}
        >
          Yamme Tee was here...
        </h1>

        {children}
      </body>
    </html>
  );
}
