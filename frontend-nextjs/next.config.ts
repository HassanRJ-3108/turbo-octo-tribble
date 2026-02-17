import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { hostname: "res.cloudinary.com" },
      { hostname: "*.supabase.co" },
      { hostname: "*.googleapis.com" },
    ]
  }
};

export default nextConfig;
