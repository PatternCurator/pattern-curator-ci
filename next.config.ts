import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // If you later need external images, add remotePatterns here.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
