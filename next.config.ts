import type { NextConfig } from "next";

// Gallery photos are served from Supabase Storage. next/image only optimizes
// remote images from hosts listed here, so derive the host from the same
// env var the Supabase client uses.
function supabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const hostname = supabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: hostname
      ? [{ protocol: "https", hostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
