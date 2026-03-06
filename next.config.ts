import type { NextConfig } from "next";

let supabaseHostname: string | null = null;
try {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  supabaseHostname = raw ? new URL(raw).hostname : null;
} catch {
  supabaseHostname = null;
}

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "music.yandex.com",
      },
      {
        protocol: "https",
        hostname: "zvuk.com",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
            },
          ]
        : []),
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;
