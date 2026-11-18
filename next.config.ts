import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep canonical, robots and brand metadata in the initial document head.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
