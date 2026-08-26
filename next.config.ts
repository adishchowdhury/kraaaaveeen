import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-llama-cpp"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
