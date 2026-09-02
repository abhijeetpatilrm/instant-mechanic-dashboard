import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict mode for catching React issues early
  reactStrictMode: true,

  // Allow cross-origin API calls in dev
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },

  // Type-safe image domains can be added here in Phase 3
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
