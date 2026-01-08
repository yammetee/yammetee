import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400"],
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
          height: "100vh",
          width: "100vw",
          backgroundColor: "#0a0a0a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "'Lora', serif",
          color: "#ffffff",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "10vh",
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
