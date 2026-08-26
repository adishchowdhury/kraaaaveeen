import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-llama-cpp"],
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  output: "standalone",
  experimental: {
    workerThreads: false,
    cpus: 1
  }
};

export default nextConfig;
