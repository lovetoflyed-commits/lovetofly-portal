import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', <--- REMOVA OU COMENTE ESSA LINHA
  images: {
    unoptimized: true, 
  },
};

export default nextConfig;
