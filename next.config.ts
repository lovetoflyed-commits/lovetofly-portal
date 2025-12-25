import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora erros de tipo no projeto durante o build
    ignoreBuildErrors: true,
  },
  // @ts-ignore: Ignora erro de tipagem para a propriedade eslint
  eslint: {
    // Ignora erros de linting durante o build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
