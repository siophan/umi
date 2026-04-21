import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:4000/health',
      },
      {
        source: '/openapi.json',
        destination: 'http://localhost:4000/openapi.json',
      },
      {
        source: '/docs',
        destination: 'http://localhost:4000/docs',
      },
    ];
  },
};

export default nextConfig;
