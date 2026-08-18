import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["better-sqlite3", "archiver"],
};

export default nextConfig;
