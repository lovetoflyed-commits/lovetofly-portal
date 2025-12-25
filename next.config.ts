import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Removemos a parte do eslint que estava dando erro na versão nova
};

export default nextConfig;
