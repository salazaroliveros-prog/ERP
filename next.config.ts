import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'd3'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
