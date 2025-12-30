import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
    allowedDevOrigins: ['192.168.1.8'],
};

export default nextConfig;
