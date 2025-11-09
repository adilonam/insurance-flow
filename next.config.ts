import type { NextConfig } from "next";

import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  /** Fix prisma client issue when deploying to Vercel */
  webpack: (config, { isServer }) => {
    if (isServer) config.plugins = [...config.plugins, new PrismaPlugin()];

    return config;
  },
  turbopack: {},
};

export default nextConfig;
