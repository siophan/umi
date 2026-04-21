import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // 明确把 monorepo 根目录钉在 umi，避免 Next 在多锁文件场景下把 .next 产物打坏。
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
