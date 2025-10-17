import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "./",
  },
  images: {
    domains: ["avatars.githubusercontent.com", "github.com"],
  },
};

export default nextConfig;
